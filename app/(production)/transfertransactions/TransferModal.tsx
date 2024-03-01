'use client'
import { CustomButton } from '@/components/index'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useSupabase } from '@/context/SupabaseProvider'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useFilter } from '@/context/FilterContext'
import { FinalProductTypes, OfficeTypes, TransferedProductTypes } from '@/types'
import { logError } from '@/utils/fetchApi'
import { cn } from '@/utils/shadcn'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, PlusIcon, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const FormSchema = z.object({
  office_id: z
    .string({
      required_error: 'Office is required.',
    })
    .min(1, { message: 'Office is required..' }),
  transfer_date: z.date({
    required_error: 'Transfer Date is required.',
  }),
  memo: z.string().optional(),
  confirmed: z.literal(true, {
    errorMap: () => ({ message: 'Confirmation is required' }),
  }),
})

interface ModalProps {
  hideModal: () => void
}

interface ProductListTypes {
  product_id: number
  quantity: number
  transfer_quantity: number
  product_name: string
  category: string
  size: string
  value: string
}

interface ProductDropdownTypes {
  product_id: number
  label: string
  value: string
}

const TransferModal = ({ hideModal }: ModalProps) => {
  const { supabase, session, systemOffices } = useSupabase()
  const { setToast } = useFilter()

  // Select product error
  const [productError, setProductError] = useState('')

  // loading state
  const [loading, setLoading] = useState(false)

  // Products Dropdown
  const [open, setOpen] = useState(false)
  const [productsList, setProductsList] = useState<ProductListTypes[] | null>(
    null
  )
  const [productsDropdown, setProductsDropdown] = useState<
    ProductDropdownTypes[] | []
  >([])

  // Products to transfer
  const [selectedProducts, setSelectedProducts] = useState<
    ProductListTypes[] | []
  >([])

  const offices: OfficeTypes[] = systemOffices.filter(
    (o: OfficeTypes) => o.type !== 'Warehouse'
  )

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      office_id: undefined,
      transfer_date: new Date(),
    },
  })

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (selectedProducts.length === 0) {
      setProductError('Please select products')
      alert('a')
      return
    }
    setProductError('')
    await handleTransfer(data)
  }

  const handleTransfer = async (formdata: z.infer<typeof FormSchema>) => {
    const office: OfficeTypes = systemOffices.find(
      (office: OfficeTypes) =>
        office.id.toString() === formdata.office_id.toString()
    )

    try {
      const { data: finalProducts } = await supabase
        .from('agriko_final_products')
        .select()
        .gt('quantity', 0)

      const products: TransferedProductTypes[] = selectedProducts.map((p) => {
        return {
          product_id: p.product_id,
          name: p.product_name,
          size: p.size,
          category: p.category,
          quantity: p.transfer_quantity,
        }
      })
      const filteredProducts = products.filter(
        (p) => p.quantity.toString() !== '0'
      )

      // update the Inventory of final products
      const upsertData: { product_id: number; quantity: number }[] = []
      const insertLogData: {
        user_id: string
        product_id: number
        custom_message: string
        log: any
      }[] = []
      filteredProducts.forEach((filteredP) => {
        const finalProd: FinalProductTypes = finalProducts.find(
          (finalP: FinalProductTypes) =>
            finalP.product_id === filteredP.product_id
        )
        // check if stock is greater than the transfered quantity
        if (finalProd.quantity >= filteredP.quantity) {
          upsertData.push({
            product_id: filteredP.product_id,
            quantity: Number(finalProd.quantity) - Number(filteredP.quantity),
          })

          insertLogData.push({
            log: [],
            user_id: session.user.id,
            product_id: filteredP.product_id,
            custom_message: `Transfered ${filteredP.quantity} to ${
              office.name
            }. Transfer Date: ${format(
              new Date(formdata.transfer_date),
              'MMMM dd, yyyy'
            )}`,
          })
        } else {
          setToast(
            'error',
            'Transfer quantity exceeds the maximum allowed quantity, please try again'
          )
          setSelectedProducts([])
          throw new Error(error.message)
        }
      })

      // Update the inventory in the database
      const { error } = await supabase
        .from('agriko_final_products')
        .upsert(upsertData)

      if (error) {
        void logError(
          'Update final Product Quantity',
          'agriko_final_products',
          JSON.stringify(upsertData),
          'Update final Product Quantity Error'
        )
        setToast(
          'error',
          'Saving failed, please reload the page or contact Berl.'
        )
        throw new Error(error.message)
      }

      // Create logs
      await supabase.from('agriko_change_logs').insert(insertLogData)

      // Create Transfer transaction record
      const transferData = {
        office_id: formdata.office_id,
        transfer_date: formdata.transfer_date,
        memo: formdata.memo,
        status: 'To Receive',
        products: filteredProducts,
        transfered_by: session.user.id,
      }

      const { error: error2 } = await supabase
        .from('agriko_transfer_transactions')
        .insert(transferData)

      if (error2) {
        void logError(
          'Product Transfer',
          'agriko_transfer_transactions',
          JSON.stringify(transferData),
          'Product Transfer Error'
        )
        setToast(
          'error',
          'Saving failed, please reload the page or contact Berl.'
        )
        throw new Error(error2.message)
      }

      // Append new data in redux
      const updatedData = {
        ...transferData,
        office,
        transfer_date: format(new Date(formdata.transfer_date), 'yyyy-MM-dd'),
      }
      dispatch(updateList([updatedData, ...globallist]))

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: Number(resultsCounter.showing) + 1,
          results: Number(resultsCounter.results) + 1,
        })
      )

      // pop up the success message
      setToast('success', 'Successfully Transfered')

      // hide the modal
      hideModal()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSelectProduct = (value: string) => {
    if (!productsList) return

    const selectedProduct = productsList.find(
      (p) => p.value.toLowerCase() === value.toLowerCase()
    )

    if (selectedProduct) {
      setSelectedProducts([...selectedProducts, selectedProduct])

      // remove from dropdown list
      if (!productsDropdown) return

      const updatedList = productsDropdown.filter(
        (p) => p.product_id !== selectedProduct.product_id
      )
      setProductsDropdown(updatedList)
    }
  }

  const handleRemoveProduct = (product: ProductListTypes) => {
    // Return the product to dropdown list
    setProductsDropdown([
      ...productsDropdown,
      {
        product_id: product.product_id,
        label: product.value,
        value: product.value,
      },
    ])

    // Remove selected products list
    const updatedList = selectedProducts.filter(
      (p) => p.product_id !== product.product_id
    )
    setSelectedProducts(updatedList)
  }

  const handleChangeQuantity = (value: string, product: ProductListTypes) => {
    const qty = Number(value)
    if (Number(product.quantity) < qty || qty < 0) return // return if it exceeds available stocks

    const updatedCart = selectedProducts.map((p: ProductListTypes) => {
      if (p.product_id === product.product_id) {
        return {
          ...p,
          transfer_quantity: qty,
        }
      }
      return p
    })
    setSelectedProducts(updatedCart)
  }

  useEffect(() => {
    // Fetch from database
    ;(async () => {
      setLoading(true)

      const { data } = await supabase
        .from('agriko_final_products')
        .select('*, product: product_id(*)')
        .gt('quantity', 0)
        .order('product_id', { ascending: true })

      if (data) {
        const prodArr: ProductListTypes[] = []
        const prodDropdown: ProductDropdownTypes[] = []
        // Structure the product array
        data.forEach((p: FinalProductTypes) => {
          const size =
            p.product.size === 'Custom Size'
              ? p.product.custom_size
              : p.product.size

          prodArr.push({
            product_id: p.product_id,
            quantity: p.quantity,
            product_name: p.product.name,
            category: p.product.category,
            size,
            value: `${p.product.name} (${size})`,
            transfer_quantity: 0,
          })
          prodDropdown.push({
            product_id: p.product.id,
            label: `${p.product.name} (${size})`,
            value: `${p.product.name} (${size})`,
          })
        })

        setProductsList(prodArr)
        setProductsDropdown(prodDropdown)
      }

      setLoading(false)
    })()
  }, [])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Transfer Products</h5>
              <button
                onClick={hideModal}
                disabled={form.formState.isSubmitting}
                type="button"
                className="app__modal_header_btn">
                &times;
              </button>
            </div>

            <div className="app__modal_body">
              {loading && <TwoColTableLoading />}
              {!loading && (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6">
                    <FormField
                      control={form.control}
                      name="office_id"
                      render={({ field }) => (
                        <FormItem className="w-[300px]">
                          <FormLabel className="app__form_label">
                            Transfer to
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose Office" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {offices.map((office, index) => (
                                <SelectItem
                                  key={index}
                                  value={office.id.toString()}>
                                  {office.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="transfer_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="app__form_label">
                            Transfer Date
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={'outline'}
                                  className={cn(
                                    'w-[240px] pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}>
                                  {field.value ? (
                                    format(field.value, 'PPP')
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date('1900-01-01')
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Popover
                      open={open}
                      onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-[300px] justify-between app__btn_green hover:!bg-emerald-600 hover:!text-white">
                          Click to choose products
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search Product..."
                            className="h-9"
                          />
                          <CommandEmpty>No Product found.</CommandEmpty>
                          <CommandGroup>
                            {productsDropdown.map((product) => (
                              <CommandItem
                                key={product.value}
                                value={product.label}
                                onSelect={(currentValue) => {
                                  // setValue(
                                  //   currentValue === value ? '' : currentValue
                                  // )
                                  handleSelectProduct(currentValue)
                                  setOpen(false)
                                }}>
                                {product.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {productError !== '' && selectedProducts.length === 0 && (
                      <div className="text-red-500 text-sm font-medium">
                        {productError}
                      </div>
                    )}

                    {selectedProducts.length > 0 && (
                      <table className="app__table">
                        <thead className="app__thead">
                          <tr>
                            <th className="app__th">Product</th>
                            <th className="app__th">Available Stock</th>
                            <th className="app__th">Transfer Quantity</th>
                            <th className="app__th"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProducts.map((product, idx) => (
                            <tr
                              key={idx}
                              className="app__tr">
                              <td className="app__td">{product.value}</td>
                              <td className="app__td">{product.quantity}</td>
                              <td className="app__td">
                                <input
                                  type="number"
                                  onChange={(e) =>
                                    handleChangeQuantity(
                                      e.target.value,
                                      product
                                    )
                                  }
                                  className="text-base font-bold outline-none w-20 px-2 py-1 border border-slate-400 rounded-lg"
                                  value={product.transfer_quantity}
                                />
                              </td>
                              <td className="app__td">
                                <X
                                  className="w-6 h-6 text-red-500 cursor-pointer"
                                  onClick={() => handleRemoveProduct(product)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    <FormField
                      control={form.control}
                      name="memo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Memo</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Short message about this transaction"
                              className="resize-none"
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
                              By checking this, you acknowledge that the
                              provided details are accurate.
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
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TransferModal
