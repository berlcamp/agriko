'use client'

import { CustomButton } from '@/components/index'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useSupabase } from '@/context/SupabaseProvider'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
// Redux imports
import { useFilter } from '@/context/FilterContext'
import { PTypes, RawMaterialTypes } from '@/types'
import { logError } from '@/utils/fetchApi'
import { handleLogChanges } from '@/utils/text-helper'

const FormSchema = z.object({
  quantity: z.coerce // use coerce to cast to string to number https://stackoverflow.com/questions/76878664/react-hook-form-and-zod-inumber-input
    .number({
      required_error: 'Quantity is required.',
      invalid_type_error: 'Quantity is required',
    })
    .positive({
      message: 'Quantity is required...',
    }),
  remarks: z.string({
    required_error: 'Remarks is required.',
  }),
  confirmed: z.literal(true, {
    errorMap: () => ({ message: 'Confirmation is required' }),
  }),
})

interface UpsertArrayTypes {
  id: number
  quantity: number
}

interface InsertLogArray {
  user_id: string
  raw_material_id: number
  custom_message: string
  log: any
}

interface ModalProps {
  hideModal: () => void
  selectedProduct: PTypes
  addOrAdjust: string
}

const AddEditModal = ({
  selectedProduct,
  addOrAdjust,
  hideModal,
}: ModalProps) => {
  const { supabase, session } = useSupabase()
  const { setToast } = useFilter()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      quantity: addOrAdjust === 'add' ? 0 : selectedProduct.quantity,
      remarks: '',
    },
  })

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    await handleAddQuantity(data)
  }

  const handleAddQuantity = async (formdata: z.infer<typeof FormSchema>) => {
    try {
      const oldQty = Number(selectedProduct.quantity)

      const newQty =
        addOrAdjust === 'add'
          ? oldQty + Number(formdata.quantity)
          : Number(formdata.quantity)

      const newData = {
        product_id: selectedProduct.id,
        quantity: newQty,
      }

      const { error } = await supabase
        .from('agriko_final_products')
        .upsert(newData)

      if (error) {
        void logError(
          'Add Product Quantity',
          'agriko_final_products',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page or contact Berl.'
        )
        throw new Error(error.message)
      }

      // Log changes
      handleLogChanges(
        {},
        {},
        'product_id',
        selectedProduct.id,
        session.user.id,
        `${
          addOrAdjust === 'add'
            ? `Added ${formdata.quantity} to quantity`
            : `Adjusted Quantity from ${selectedProduct.quantity} to ${formdata.quantity}`
        }. Remarks: ${formdata.remarks}`
      )

      // pop up the success message
      setToast('success', 'Successfully Save')

      // Update Raw Materials stocks
      await handleUpdateRawMaterialStock(formdata)

      // hide the modal
      hideModal()
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdateRawMaterialStock = async (
    formdata: z.infer<typeof FormSchema>
  ) => {
    if (
      !selectedProduct.raw_materials ||
      selectedProduct.raw_materials.length === 0
    ) {
      return
    }

    const rawRaterials = selectedProduct.raw_materials

    try {
      const rmIds: number[] = []

      rawRaterials.forEach((rm) => {
        rmIds.push(rm.id)
      })

      // Get all in-stock Raw Materials
      const { data: inStockRawData } = await supabase
        .from('agriko_rawmaterials')
        .select()
        .in('id', rmIds)

      const inStockRawMaterials: RawMaterialTypes[] | [] = inStockRawData

      // Create upsertArray
      const upsertArray: UpsertArrayTypes[] = []
      const insertLogArray: InsertLogArray[] = []

      rawRaterials.forEach((rm) => {
        const inStock = inStockRawMaterials.find(
          (s) => s.id.toString() === rm.id.toString()
        )

        if (inStock) {
          // upsert array
          upsertArray.push({
            id: rm.id,
            quantity:
              Number(inStock.quantity) -
              Number(rm.quantity) * Number(formdata.quantity),
          })
          // Insert log array
          insertLogArray.push({
            log: [],
            user_id: session.user.id,
            raw_material_id: rm.id,
            custom_message: `${
              formdata.quantity
            } Final product/s finished, deducted ${
              Number(rm.quantity) * Number(formdata.quantity)
            } item/s to this raw material.`,
          })
        }
      })

      // Execut upsert
      const { error: error2 } = await supabase
        .from('agriko_rawmaterials')
        .upsert(upsertArray)

      if (error2) {
        void logError(
          'Update raw materials stocks after add final product',
          'agriko_office_products',
          JSON.stringify(upsertArray),
          'Upsert error'
        )
        setToast(
          'error',
          'Saving failed, please reload the page or contact Berl.'
        )
        throw new Error(error2.message)
      }

      // Create logs
      if (insertLogArray.length > 0) {
        await supabase.from('agriko_change_logs').insert(insertLogArray)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">
                {addOrAdjust === 'add'
                  ? 'Add Final Product'
                  : 'Adjust Quantity'}
              </h5>
              <button
                onClick={hideModal}
                disabled={form.formState.isSubmitting}
                type="button"
                className="app__modal_header_btn">
                &times;
              </button>
            </div>

            <div className="app__modal_body">
              <div className="text-center pb-2 mb-2 font-semibold text-gray-700 border-b">
                {selectedProduct.product_name} {selectedProduct.unit}
              </div>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="app__form_label">
                          {addOrAdjust === 'add'
                            ? 'Quantity'
                            : 'Adjust Quantity'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter Amount"
                            className="w-[240px]"
                            {...field}
                          />
                        </FormControl>
                        {addOrAdjust === 'add' ? (
                          <FormDescription className="bg-green-100 border border-green-400 p-2 text-gray-600 text-xs">
                            Adding Final Product will{' '}
                            <span className="font-bold underline underline-offset-2 text-black">
                              AUTOMATICALLY
                            </span>{' '}
                            adjust the Raw Materials stocks.
                          </FormDescription>
                        ) : (
                          <FormDescription className="bg-green-100 border border-green-400 p-2 text-gray-600 text-xs">
                            Quantity adjustments will{' '}
                            <span className="font-bold underline underline-offset-2 text-black">
                              NOT
                            </span>{' '}
                            affect the Raw Materials stocks.
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="app__form_label">
                          Remarks
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Write Remarks (optional)"
                            className="w-full"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <hr />
                  <FormField
                    control={form.control}
                    name="confirmed"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-gray-600 text-xs">
                            By checking this, you acknowledge that the provided
                            details are accurate.
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="app__modal_footer">
                    <CustomButton
                      btnType="submit"
                      isDisabled={form.formState.isSubmitting}
                      title={
                        form.formState.isSubmitting ? 'Saving...' : 'Submit'
                      }
                      containerStyles="app__btn_green"
                    />
                    <CustomButton
                      btnType="button"
                      isDisabled={form.formState.isSubmitting}
                      title="Cancel"
                      handleClick={hideModal}
                      containerStyles="app__btn_gray"
                    />
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AddEditModal
