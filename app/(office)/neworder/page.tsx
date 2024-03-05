'use client'
import SearchCustomerInput from '@/components/SearchCustomerInput'
import {
  CustomButton,
  MainSideBar,
  Sidebar,
  Title,
  TopBar,
} from '@/components/index'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  AccountTypes,
  CustomerTypes,
  OfficeProductTypes,
  OrderTransactionTypes,
  OrderedProductTypes,
  PurchasedProductsTypes,
} from '@/types'
import { logError } from '@/utils/fetchApi'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { PlusIcon, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { TbCurrencyPeso } from 'react-icons/tb'
import { z } from 'zod'
import ReceiptModal from './ReceiptModal'

interface ProductListTypes {
  product_id: number
  quantity: number
  order_quantity: number
  product_name: string
  category: string
  size: string
  price: number
  discount_type: string
  discounted_price: number
  sub_total: number
  value: string
}

interface ProductDropdownTypes {
  product_id: number
  price: number
  discount_type: string
  discounted_price: number
  label: string
  value: string
}

interface OldCustomerValues {
  customer_id: string
  name_address: string
}

interface UpsertArrayTypes {
  id: number
  quantity: number
}
interface InsertLogArray {
  user_id: string
  office_product_id: number
  custom_message: string
  log: any
}

const FormSchema = z.object({
  new_customer: z.string().min(1, {
    message: 'Customer Name is required.',
  }),
  new_customer_address: z.string().optional(),
  old_customer_id: z.string().min(1, {
    message: 'Customer Name is required.',
  }),
  cash: z.coerce // use coerce to cast to string to number https://stackoverflow.com/questions/76878664/react-hook-form-and-zod-inumber-input
    .number({
      required_error: 'Cash is required.',
      invalid_type_error: 'Cash is required',
    })
    .positive({
      message: 'Cash is required...',
    }),
  confirmed: z.literal(true, {
    errorMap: () => ({ message: 'Confirmation is required' }),
  }),
})

export default function Page() {
  const { supabase, session, currentUser } = useSupabase()
  const { setToast } = useFilter()

  const activeUser: AccountTypes = currentUser

  // Receipt modal
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [orderedProducts, setOrderedProducts] = useState<
    OrderedProductTypes[] | []
  >([])

  // Cart
  const [cartTotal, setCartTotal] = useState(0)

  // Checkout
  const [change, setChange] = useState(0)
  const [customerCash, setCustomerCash] = useState(0)
  const [isNewCustomer, setIsNewCustomer] = useState(true)
  const [oldCustomers, setOldCustomers] = useState<OldCustomerValues[] | []>([])
  const [oldCustomerId, setOldCustomerId] = useState('')

  // Select product error
  const [productError, setProductError] = useState('')

  // loading state
  const [loading, setLoading] = useState(false)

  const [productsList, setProductsList] = useState<ProductListTypes[] | null>(
    null
  )

  // Products Dropdown
  const [open, setOpen] = useState(false)
  const [productsDropdownOriginal, setProductsDropdownOriginal] = useState<
    ProductDropdownTypes[] | []
  >([])
  const [productsDropdown, setProductsDropdown] = useState<
    ProductDropdownTypes[] | []
  >([])

  // Cart Products
  const [selectedProducts, setSelectedProducts] = useState<
    ProductListTypes[] | []
  >([])

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      new_customer: '',
      new_customer_address: '',
      old_customer_id: ' ',
      cash: 0,
    },
  })

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      // Start - Store the customer
      // Create customer if and get customer_id if New otherwise get the customer_id if old
      let customerId: any = ''

      if (isNewCustomer) {
        const newCustomerArray = {
          name: data.new_customer,
          address: data.new_customer_address,
          office_id: activeUser.active_office_id,
        }
        const { data: newCustomer, error } = await supabase
          .from('agriko_customers')
          .insert(newCustomerArray)
          .select()
        if (error) {
          void logError(
            'Create new customer',
            'agriko_customers',
            JSON.stringify(newCustomerArray),
            'Create new customer error'
          )
          setToast('error', 'Saving failed, please reload the page.')
          throw new Error(error.message)
        }
        customerId = newCustomer[0].id
      } else {
        customerId = oldCustomerId
      }
      // End - Store the customer

      // Start - Store the transaction
      const productIdsOrdered: PurchasedProductsTypes[] = []
      selectedProducts.forEach((p) => {
        productIdsOrdered.push({
          product_id: p.product_id,
          name: p.product_name,
          size: p.size,
          category: p.category,
          quantity: p.order_quantity,
          price: p.price,
        })
      })
      const orderTransactionArray: OrderTransactionTypes = {
        customer_id: customerId,
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        cashier_id: session.user.id,
        total_amount: cartTotal,
        office_id: activeUser.active_office_id,
        products_ordered: productIdsOrdered,
      }

      const { data: orderTransaction, error: error2 } = await supabase
        .from('agriko_order_transactions')
        .insert(orderTransactionArray)
        .select()
      if (error2) {
        void logError(
          'Create order transaction',
          'agriko_customers',
          JSON.stringify(orderTransaction),
          'Create new customer error'
        )
        setToast('error', 'Saving failed, please reload the page.')
        throw new Error(error2.message)
      }
      const orderTransactionId = orderTransaction[0].id
      // End - Store the transaction

      // Start - Store the ordered products
      const orderedProductsArray: OrderedProductTypes[] = []
      selectedProducts.forEach((p) => {
        orderedProductsArray.push({
          transaction_date: format(new Date(), 'yyyy-MM-dd'),
          transaction_id: Number(orderTransactionId),
          product_id: p.product_id,
          quantity: p.order_quantity,
          total_amount: p.sub_total,
          cashier_id: session.user.id,
          office_id: activeUser.active_office_id,
          product_category: p.category,
          product_size: p.size,
          product_price: p.price,
          product_name: p.product_name,
          status: '',
          discounted_price: p.discount_type !== 'None' ? p.discounted_price : 0,
          discount_total:
            p.discount_type !== 'None'
              ? (Number(p.price) - Number(p.discounted_price)) *
                Number(p.order_quantity)
              : 0,
        })
      })

      const { error: error3 } = await supabase
        .from('agriko_ordered_products')
        .insert(orderedProductsArray)
      if (error3) {
        void logError(
          'Store ordered products',
          'agriko_ordered_products',
          JSON.stringify(orderTransaction),
          'Store ordered products error'
        )
        setToast('error', 'Saving failed, please reload the page.')
        throw new Error(error3.message)
      }
      // End - Store ordered products

      // Update Inventory of office products
      await handleUpdateProductsStock()

      // Transaction completed successfully, show receipt modal
      setOrderedProducts(orderedProductsArray)
      setShowReceiptModal(true)
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateProductsStock = async () => {
    try {
      const pIds: number[] = []
      selectedProducts.forEach((p) => {
        pIds.push(p.product_id)
      })

      // Get all in-stock products matching transfered products
      const { data: inStockProductsData } = await supabase
        .from('agriko_office_products')
        .select()
        .eq('office_id', activeUser.active_office_id)
        .in('product_id', pIds)

      const inStockProducts: OfficeProductTypes[] | [] = inStockProductsData

      // Create upsertArray
      const upsertArray: UpsertArrayTypes[] = []
      const insertLogArray: InsertLogArray[] = []
      selectedProducts?.forEach((selProd) => {
        const inStockProduct = inStockProducts.find(
          (s) => s.product_id.toString() === selProd.product_id.toString()
        )

        if (inStockProduct) {
          // Upsert
          upsertArray.push({
            id: inStockProduct.id,
            quantity:
              Number(inStockProduct.quantity) - Number(selProd.order_quantity),
          })
          // Insert log array
          insertLogArray.push({
            log: [],
            user_id: session.user.id,
            office_product_id: inStockProduct.id,
            custom_message: `Customer purchased ${selProd.order_quantity} item/s of this product.`,
          })
        }
      })

      // Execut upsert
      const { error: error2 } = await supabase
        .from('agriko_office_products')
        .upsert(upsertArray)
        .select()

      if (error2) {
        void logError(
          'Receive Products Upsert',
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

  const handleSelectProduct = (value: string) => {
    if (!productsList) return

    const selectedProduct = productsList.find(
      (p) => p.value.toLowerCase() === value.toLowerCase()
    )

    if (selectedProduct) {
      const updatedCart = [...selectedProducts, selectedProduct]
      setSelectedProducts(updatedCart)

      // remove from dropdown list
      if (!productsDropdown) return

      const updatedList = productsDropdown.filter(
        (p) => p.product_id !== selectedProduct.product_id
      )
      setProductsDropdown(updatedList)

      // Get cart total
      let total = 0
      updatedCart.forEach((product) => {
        if (product.discount_type !== 'None') {
          total +=
            Number(product.discounted_price) * Number(product.order_quantity)
        } else {
          total += Number(product.price) * Number(product.order_quantity)
        }
      })
      setCartTotal(total)

      // Change
      if (Number(customerCash) > Number(total)) {
        setChange(Number(customerCash) - Number(total))
      } else {
        setChange(0)
      }
    }
  }

  const handleRemoveProduct = (product: ProductListTypes) => {
    // Return the product to dropdown list
    setProductsDropdown([
      ...productsDropdown,
      {
        product_id: product.product_id,
        price: product.price,
        discount_type: product.discount_type,
        discounted_price: product.discounted_price,
        label: product.value,
        value: product.value,
      },
    ])

    // Remove selected products list
    const updatedList = selectedProducts.filter(
      (p) => p.product_id !== product.product_id
    )
    setSelectedProducts(updatedList)

    // Get cart total
    let total = 0
    updatedList.forEach((product) => {
      if (product.discount_type !== 'None') {
        total +=
          Number(product.discounted_price) * Number(product.order_quantity)
      } else {
        total += Number(product.price) * Number(product.order_quantity)
      }
    })
    setCartTotal(total)

    // Change
    if (Number(customerCash) > Number(total)) {
      setChange(Number(customerCash) - Number(total))
    } else {
      setChange(0)
    }
  }

  const handleChangeQuantity = (value: string, product: ProductListTypes) => {
    const qty = Number(value)

    if (qty === 0) return // return if 0

    if (Number(product.quantity) < qty || qty < 0) return // return if it exceeds available stocks

    const updatedCart = selectedProducts.map((p: ProductListTypes) => {
      if (p.product_id === product.product_id) {
        return {
          ...p,
          order_quantity: qty,
          sub_total:
            p.discount_type !== 'None'
              ? Number(qty) * Number(p.discounted_price)
              : Number(qty) * Number(p.price),
        }
      }
      return p
    })
    setSelectedProducts(updatedCart)

    // Get cart total
    let total = 0
    updatedCart.forEach((product) => {
      if (product.discount_type !== 'None') {
        total +=
          Number(product.discounted_price) * Number(product.order_quantity)
      } else {
        total += Number(product.price) * Number(product.order_quantity)
      }
    })
    setCartTotal(total)

    // Change
    if (Number(customerCash) > Number(total)) {
      setChange(Number(customerCash) - Number(total))
    } else {
      setChange(0)
    }
  }

  useEffect(() => {
    // Fetch from database
    ;(async () => {
      setLoading(true)

      const { data } = await supabase
        .from('agriko_office_products')
        .select('*, product: product_id(*)')
        .gt('quantity', 0)
        .eq('office_id', activeUser.active_office_id)
        .order('product_id', { ascending: true })

      if (data) {
        const prodArr: ProductListTypes[] = []
        const prodDropdown: ProductDropdownTypes[] = []
        // Structure the product array
        data.forEach((p: OfficeProductTypes) => {
          const size =
            p.product.size === 'Custom Size'
              ? p.product.custom_size
              : p.product.size

          prodArr.push({
            product_id: p.product_id,
            quantity: p.quantity,
            product_name: p.product.name,
            price: p.product.price,
            discounted_price: p.product.discounted_price,
            discount_type: p.product.discount_type,
            sub_total:
              p.product.discount_type !== 'None'
                ? p.product.discounted_price
                : p.product.discounted_price,
            category: p.product.category,
            size,
            value: `${p.product.name} (${size})`,
            order_quantity: 1,
          })
          prodDropdown.push({
            product_id: p.product.id,
            price: p.product.price,
            discount_type: p.product.discount_type,
            discounted_price: p.product.discounted_price,
            label: `${p.product.name} (${size})`,
            value: `${p.product.name} (${size})`,
          })
        })

        setProductsList(prodArr)
        setProductsDropdown(prodDropdown)
        setProductsDropdownOriginal(prodDropdown) // use for form.reset()
      }

      const { data: customers } = await supabase
        .from('agriko_customers')
        .select()
        .eq('office_id', activeUser.active_office_id)

      if (customers) {
        const oldCust: any = []
        customers.forEach((c: CustomerTypes) => {
          oldCust.push({
            name_address: `${c.name} - ${c.address} #${c.id}`,
            customer_id: c.id,
          })
        })
        setOldCustomers(oldCust)
      }

      setLoading(false)
    })()
  }, [form.reset])

  return (
    <>
      <Sidebar>
        <MainSideBar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div className="app__title">
          <Title title="New Order" />
        </div>
        {/* Columns Wrapper */}
        <div className="mt-4 grid lg:grid-cols-3 gap-4 mx-4 min-h-96">
          {/* Order Items */}
          <div className="lg:col-span-2 bg-white border border-gray-300 p-2">
            <div className="space-y-6">
              <Popover
                open={open}
                onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between !py-8 text-lg text-slate-700 bg-slate-200 hover:bg-slate-300 border-slate-400">
                    Click to choose products
                    <PlusIcon className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] md:w-[500px] p-0">
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
                          <div className="w-full flex items-center justify-between">
                            <div>{product.label}</div>
                            <div>
                              {product.discount_type !== 'None' ? (
                                <div className="flex items-center space-4">
                                  <div className="flex items-center line-through text-red-500">
                                    <TbCurrencyPeso />
                                    {product.price}
                                  </div>
                                  <div className="flex items-center">
                                    <TbCurrencyPeso />
                                    {product.discounted_price}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <TbCurrencyPeso />
                                  {product.price}
                                </div>
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              {selectedProducts.length === 0 && (
                <div className="w-2/3 border border-dashed mx-auto text-center p-4 text-lg text-gray-500">
                  No item in the cart
                </div>
              )}

              {selectedProducts.length > 0 && (
                <table className="app__table">
                  <thead className="app__thead">
                    <tr>
                      <th className="app__th">Product</th>
                      <th className="app__th">Stocks</th>
                      <th className="app__th">Price</th>
                      <th className="app__th">Quantity</th>
                      <th className="app__th">Sub Total</th>
                      <th className="app__th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProducts.map((product, idx) => (
                      <tr
                        key={idx}
                        className="app__tr">
                        <td className="app__td">
                          <span className="text-base text-gray-800">
                            {product.value}
                          </span>
                        </td>
                        <td className="app__td">
                          <span className="text-base text-gray-800">
                            {product.quantity}
                          </span>
                        </td>
                        <td className="app__td">
                          <div className="text-base text-gray-800">
                            {product.discount_type !== 'None' ? (
                              <div className="flex items-center space-4">
                                <div className="flex items-center line-through text-red-500">
                                  <TbCurrencyPeso />
                                  {product.price}
                                </div>
                                <div className="flex items-center">
                                  <TbCurrencyPeso />
                                  {product.discounted_price}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <TbCurrencyPeso />
                                {product.price}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="app__td">
                          <input
                            type="number"
                            onChange={(e) =>
                              handleChangeQuantity(e.target.value, product)
                            }
                            className="text-base font-bold outline-none w-20 px-2 py-1 border border-slate-400 rounded-lg"
                            value={product.order_quantity}
                          />
                        </td>
                        <td className="app__td">
                          <div className="flex items-center text-base text-gray-800">
                            <TbCurrencyPeso />
                            {product.sub_total}
                          </div>
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
            </div>
          </div>
          {/* Totals */}
          <div className="lg:col-span-1 bg-white border border-gray-300 pb-8">
            <div className="w-full bg-green-600 px-4 py-2">
              <div className="text-white text-xl">
                TOTAL:{' '}
                <span className="font-bold text-4xl">
                  {Number(cartTotal).toLocaleString('en-US')}
                </span>
              </div>
            </div>

            {/* No item in the cart */}
            {selectedProducts.length === 0 && (
              <div className="w-2/3 border border-dashed mx-auto text-center mt-6 p-4 text-lg text-gray-500">
                No item in the cart
              </div>
            )}

            {/* Customer */}
            {cartTotal !== 0 && (
              <div className="">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4">
                    <Tabs
                      defaultValue="new"
                      className="w-full">
                      <TabsList className="grid w-full grid-cols-2 px-4 !rounded-none mt-4">
                        <TabsTrigger
                          value="new"
                          onClick={() => {
                            form.setValue('old_customer_id', ' ')
                            form.setValue('new_customer', '')
                            setIsNewCustomer(true)
                          }}
                          className="data-[state=active]:!font-bold rounded-xl">
                          New Customer
                        </TabsTrigger>
                        <TabsTrigger
                          value="old"
                          onClick={() => {
                            form.setValue('old_customer_id', '')
                            form.setValue('new_customer', ' ')
                            setIsNewCustomer(false)
                          }}
                          className="data-[state=active]:!font-bold rounded-xl">
                          Old Customer
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent
                        value="new"
                        className="px-4 mt-4 space-y-4">
                        <FormField
                          control={form.control}
                          name="new_customer"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              {/* <FormLabel className="app__form_label">
                                New Customer Name
                              </FormLabel> */}
                              <FormControl>
                                <Input
                                  placeholder="Enter Customer Name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="new_customer_address"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              {/* <FormLabel className="app__form_label">
                                Address
                              </FormLabel> */}
                              <FormControl>
                                <Input
                                  placeholder="Customer Address (optional)"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                      <TabsContent
                        value="old"
                        className="px-4 mt-4">
                        <FormField
                          control={form.control}
                          name="old_customer_id"
                          render={() => (
                            <FormItem className="w-full">
                              {/* <FormLabel className="app__form_label">
                                Customer Name
                              </FormLabel> */}
                              <SearchCustomerInput
                                customers={oldCustomers}
                                handleSelectedId={(selected) => {
                                  form.setValue(
                                    'old_customer_id',
                                    selected.toString()
                                  )
                                  setOldCustomerId(selected)
                                }}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                    </Tabs>
                    <div className="px-4 space-y-4">
                      <FormField
                        control={form.control}
                        name="cash"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel className="app__form_label !text-lg">
                              Customer Cash
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="any"
                                className="text-lg"
                                placeholder="Cash"
                                onChangeCapture={(e) => {
                                  // Change
                                  if (
                                    Number(e.currentTarget.value) >
                                    Number(cartTotal)
                                  ) {
                                    setChange(
                                      Number(e.currentTarget.value) -
                                        Number(cartTotal)
                                    )
                                  } else {
                                    setChange(0)
                                  }
                                  setCustomerCash(Number(e.currentTarget.value))
                                }}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Change */}
                      {change > 0 && (
                        <div className="bg-blue-600 rounded-xl mx-4 px-4 py-2">
                          <div className="text-white text-lg">
                            Change:{' '}
                            <span className="font-bold text-2xl">
                              {Number(change).toLocaleString('en-US')}
                            </span>
                          </div>
                        </div>
                      )}

                      {customerCash >= cartTotal && (
                        <>
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
                          <div className="flex items-center space-x-2">
                            <CustomButton
                              btnType="submit"
                              isDisabled={form.formState.isSubmitting}
                              title={
                                form.formState.isSubmitting
                                  ? 'Processing..'
                                  : 'Complete'
                              }
                              containerStyles="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-500 border border-emerald-600 font-bold px-2 py-1 text-base text-white rounded-sm"
                            />
                            <CustomButton
                              btnType="button"
                              isDisabled={form.formState.isSubmitting}
                              title="Cancel"
                              handleClick={() => {
                                setSelectedProducts([])
                                setCartTotal(0)
                                setChange(0)
                                setCustomerCash(0)
                                form.reset()
                                setProductsDropdown(productsDropdownOriginal) //reset the products dropdown
                              }}
                              containerStyles="bg-red-500 hover:bg-red-600 active:bg-red-500 border border-red-600 font-bold px-2 py-1 text-base text-white rounded-sm"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Receipt Modal */}
      {showReceiptModal && (
        <ReceiptModal
          cartTotal={cartTotal}
          change={change}
          orderedProducts={orderedProducts}
          hideModal={() => {
            setShowReceiptModal(false)
            setSelectedProducts([])
            setCartTotal(0)
            setChange(0)
            setCustomerCash(0)
            form.reset()
            setProductsDropdown(productsDropdownOriginal) //reset the products dropdown
          }}
        />
      )}
    </>
  )
}
