'use client'

import { CustomButton } from '@/components/index'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSupabase } from '@/context/SupabaseProvider'
import { ProductTypes, RawMaterialTypes } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { productCategories, productSizes } from '@/constants'
import { useFilter } from '@/context/FilterContext'
import { logError } from '@/utils/fetchApi'
import { PlusIcon, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const FormSchema = z
  .object({
    product_name: z.string().min(1, {
      message: 'Name is required.',
    }),
    category: z.string().min(1, {
      message: 'Category is required.',
    }),
    size: z.string().min(1, {
      message: 'Size is required.',
    }),
    custom_size: z.string().optional(),
    price: z.coerce // use coerce to cast to string to number https://stackoverflow.com/questions/76878664/react-hook-form-and-zod-inumber-input
      .number({
        required_error: 'Price is required.',
        invalid_type_error: 'Price is required',
      })
      .positive({
        message: 'Price is required...',
      }),
    discount_type: z.string(),
    discounted_price: z.coerce // use coerce to cast to string to number https://stackoverflow.com/questions/76878664/react-hook-form-and-zod-inumber-input
      .number({
        required_error: 'Discounted price is required.',
        invalid_type_error: 'Discounted price is required',
      }),
    quantity_warning: z.coerce // use coerce to cast to string to number https://stackoverflow.com/questions/76878664/react-hook-form-and-zod-inumber-input
      .number({
        required_error: 'Quantity warning threshold is required.',
        invalid_type_error: 'Quantity warning threshold is required',
      })
      .positive({
        message: 'Quantity warning threshold is required...',
      }),
    confirmed: z.literal(true, {
      errorMap: () => ({ message: 'Confirmation is required' }),
    }),
  })
  .refine((data) => Number(data.discounted_price) < Number(data.price), {
    message: 'Discounted price must be less than the Original Price',
    path: ['discounted_price'],
  })

interface ModalProps {
  hideModal: () => void
  editData: ProductTypes | null
}

interface RawMaterialDropdownTypes {
  id: number
  label: string
  value: string
}

const AddEditModal = ({ editData, hideModal }: ModalProps) => {
  const { supabase } = useSupabase()
  const { setToast } = useFilter()

  const [showCustomSize, setShowCustomSize] = useState(
    editData ? (editData.size === 'Custom Size' ? true : false) : false
  )

  const [showDiscountedPrice, setShowDiscountedPrice] = useState(
    editData ? (editData.discount_type !== 'None' ? true : false) : false
  )

  // loading state
  const [loading, setLoading] = useState(false)

  // Raw Materials
  const [selectedRawMaterials, setSelectedRawMaterials] = useState<
    RawMaterialTypes[] | []
  >(editData ? editData.raw_materials || [] : [])

  // Raw Materials Dropdown
  const [open, setOpen] = useState(false)
  const [rawMaterialsList, setRawMaterialsList] = useState<
    RawMaterialTypes[] | []
  >([])
  const [rawMaterialsDropdown, setRawMaterialsDropdown] = useState<
    RawMaterialDropdownTypes[] | []
  >([])

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      product_name: editData ? editData.name : '',
      size: editData ? editData.size : '',
      custom_size: editData ? editData.custom_size || '' : '',
      price: editData ? editData.price || 0 : 0, // add zero to prevent error
      quantity_warning: editData ? editData.quantity_warning || 0 : 0, // add zero to prevent error
      discount_type: editData ? editData.discount_type : 'None',
      discounted_price: editData ? editData.discounted_price : 0,
      category: editData ? editData.category : '',
    },
  })

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (editData) {
      await handleUpdate(data)
    } else {
      await handleCreate(data)
    }
  }

  const handleCreate = async (formdata: z.infer<typeof FormSchema>) => {
    try {
      //Remove raw materials with zero quantity
      const rawMaterialsArr = selectedRawMaterials.filter(
        (p) => p.quantity.toString() !== '0'
      )

      const newData = {
        name: formdata.product_name,
        size: formdata.size,
        custom_size:
          formdata.size === 'Custom Size' ? formdata.custom_size : ' ',
        price: formdata.price,
        discount_type: formdata.discount_type,
        discounted_price: formdata.discounted_price,
        quantity_warning: formdata.quantity_warning,
        category: formdata.category,
        raw_materials: rawMaterialsArr,
        status: 'Active',
      }

      const { data, error } = await supabase
        .from('agriko_products')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create product',
          'agriko_products',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page or contact Berl.'
        )
        throw new Error(error.message)
      }

      // Append new data in redux
      const updatedData = {
        ...newData,
        id: data[0].id,
      }
      dispatch(updateList([updatedData, ...globallist]))

      // pop up the success message
      setToast('success', 'Successfully Saved.')

      // hide the modal
      hideModal()
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async (formdata: z.infer<typeof FormSchema>) => {
    if (!editData) return

    try {
      //Remove raw materials with zero quantity
      const rawMaterialsArr = selectedRawMaterials.filter(
        (p) => p.quantity.toString() !== '0'
      )

      const newData = {
        name: formdata.product_name,
        size: formdata.size,
        custom_size:
          formdata.size === 'Custom Size' ? formdata.custom_size : ' ',
        price: formdata.price,
        discount_type: formdata.discount_type,
        discounted_price: formdata.discounted_price,
        quantity_warning: formdata.quantity_warning,
        raw_materials: rawMaterialsArr,
        category: formdata.category,
      }

      const { data, error } = await supabase
        .from('agriko_products')
        .update(newData)
        .eq('id', editData?.id)

      if (error) {
        void logError(
          'Update product',
          'agriko_products',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page or contact Berl.'
        )
        throw new Error(error.message)
      }

      // Append new data in redux
      const items = [...globallist]
      const updatedData = {
        ...newData,
        id: editData.id,
      }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully Saved.')

      // hide the modal
      hideModal()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSelectMaterial = (value: string) => {
    if (!rawMaterialsList) return

    const selectedMaterial = rawMaterialsList.find(
      (p) => p.value.toLowerCase() === value.toLowerCase()
    )

    if (selectedMaterial) {
      setSelectedRawMaterials([...selectedRawMaterials, selectedMaterial])

      // remove from dropdown list
      if (!rawMaterialsDropdown) return

      const updatedList = rawMaterialsDropdown.filter(
        (p) => p.id !== selectedMaterial.id
      )
      setRawMaterialsDropdown(updatedList)
    }
  }

  const handleRemoveItem = (raw: RawMaterialTypes) => {
    // Return the product to dropdown list
    setRawMaterialsDropdown([
      ...rawMaterialsDropdown,
      {
        id: raw.id,
        label: raw.value,
        value: raw.value,
      },
    ])

    // Remove selected products list
    const updatedList = selectedRawMaterials.filter((p) => p.id !== raw.id)
    setSelectedRawMaterials(updatedList)
  }

  const handleChangeQuantity = (value: string, item: RawMaterialTypes) => {
    const qty = Number(value)

    const updatedCart = selectedRawMaterials.map((p: RawMaterialTypes) => {
      if (p.id === item.id) {
        return {
          ...p,
          quantity: qty,
        }
      }
      return p
    })
    setSelectedRawMaterials(updatedCart)
  }

  const handleSizeChange = (size: string) => {
    if (size === 'Custom Size') {
      setShowCustomSize(true)
    } else {
      setShowCustomSize(false)
    }
  }

  useEffect(() => {
    // Fetch from database
    ;(async () => {
      setLoading(true)

      const { data } = await supabase
        .from('agriko_rawmaterials')
        .select()
        .gt('quantity', 0)
        .order('name', { ascending: true })

      if (data) {
        const rawMaterialsArr: RawMaterialTypes[] = []
        const rawMaterialsDropdown: RawMaterialDropdownTypes[] = []

        // Structure the product array
        data.forEach((item: RawMaterialTypes) => {
          rawMaterialsArr.push({
            id: item.id,
            name: item.name,
            quantity: 0,
            unit: item.unit,
            value: `${item.name} (${item.unit})`,
          })

          // Do not display items that are already selected
          const findInSelected = editData
            ? editData.raw_materials?.find((rm) => rm.id === item.id)
            : undefined

          if (!findInSelected) {
            // Only active raw materials
            if (item.status === 'Active') {
              rawMaterialsDropdown.push({
                id: item.id,
                label: `${item.name} (${item.unit})`,
                value: `${item.name} (${item.unit})`,
              })
            }
          }
        })

        setRawMaterialsList(rawMaterialsArr)
        setRawMaterialsDropdown(rawMaterialsDropdown)
      }

      setLoading(false)
    })()
  }, [])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Product Details</h5>
              <button
                onClick={hideModal}
                disabled={form.formState.isSubmitting}
                type="button"
                className="app__modal_header_btn">
                &times;
              </button>
            </div>

            <div className="app__modal_body">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6">
                  <FormField
                    control={form.control}
                    name="product_name"
                    render={({ field }) => (
                      <FormItem className="w-full md:w-1/2">
                        <FormLabel className="app__form_label">
                          Product Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter Product Name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-start justify-between space-x-2">
                    <div className="w-1/2 space-y-6">
                      <FormField
                        control={form.control}
                        name="size"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel className="app__form_label">
                              Size
                            </FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value)
                                handleSizeChange(value)
                              }}
                              defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {productSizes.map((size, index) => (
                                  <SelectItem
                                    key={index}
                                    value={size}>
                                    {size}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {showCustomSize && (
                        <FormField
                          control={form.control}
                          name="custom_size"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel className="app__form_label">
                                Custom Size
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Custom Size"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                    <div className="w-1/2">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel className="app__form_label">
                              Category
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {productCategories.map((category, index) => (
                                  <SelectItem
                                    key={index}
                                    value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex items-start justify-between space-x-2">
                    <div className="w-1/2 space-y-6">
                      <FormField
                        control={form.control}
                        name="quantity_warning"
                        render={({ field }) => (
                          <FormItem className="w-full md:w-1/2">
                            <FormLabel className="app__form_label">
                              Quantity Alert
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="any"
                                placeholder="Quantity Alert Threshold"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="w-1/2 space-y-6">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem className="w-full md:w-1/2">
                            <FormLabel className="app__form_label">
                              Price
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="any"
                                placeholder="Enter Price"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex items-start justify-between space-x-2">
                    <div className="w-1/2 space-y-6">
                      <FormField
                        control={form.control}
                        name="discount_type"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel className="app__form_label">
                              Discount
                            </FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value)
                                if (value !== 'None') {
                                  setShowDiscountedPrice(true)
                                } else {
                                  setShowDiscountedPrice(false)
                                }
                              }}
                              defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Discount" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="None">None</SelectItem>
                                <SelectItem value="Amount">Amount</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="w-1/2 space-y-6">
                      {showDiscountedPrice && (
                        <FormField
                          control={form.control}
                          name="discounted_price"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel className="app__form_label">
                                Discounted Price
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="Enter Discounted Price"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>

                  <Popover
                    open={open}
                    onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[300px] justify-between app__btn_green hover:!bg-emerald-600 hover:!text-white">
                        Click to choose Raw Materials
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
                          {rawMaterialsDropdown.map((item) => (
                            <CommandItem
                              key={item.value}
                              value={item.label}
                              onSelect={(currentValue) => {
                                // setValue(
                                //   currentValue === value ? '' : currentValue
                                // )
                                handleSelectMaterial(currentValue)
                                setOpen(false)
                              }}>
                              {item.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* Raw Materils */}
                  {selectedRawMaterials.length > 0 && (
                    <table className="app__table">
                      <thead className="app__thead">
                        <tr>
                          <th className="app__th">Raw Material</th>
                          <th className="app__th">Quantity</th>
                          <th className="app__th"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRawMaterials.map((item, idx) => (
                          <tr
                            key={idx}
                            className="app__tr">
                            <td className="app__td">{item.value}</td>
                            <td className="app__td">
                              <input
                                type="number"
                                onChange={(e) =>
                                  handleChangeQuantity(e.target.value, item)
                                }
                                className="text-base font-bold outline-none w-20 px-2 py-1 border border-slate-400 rounded-lg"
                                value={item.quantity}
                              />
                            </td>
                            <td className="app__td">
                              <X
                                className="w-6 h-6 text-red-500 cursor-pointer"
                                onClick={() => handleRemoveItem(item)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  <div className="bg-green-100 border border-green-400 p-2 text-gray-700 text-xs">
                    The Raw Materials stock is automatically updated as soon as
                    the production of the final product is completed.
                  </div>

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
