/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import {
  ConfirmModal,
  CustomButton,
  MainSideBar,
  PerPage,
  ShowMore,
  Sidebar,
  TableRowLoading,
  Title,
  TopBar,
  Unauthorized,
} from '@/components/index'
import { superAdmins } from '@/constants'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { fetchOrderTransactions, logError } from '@/utils/fetchApi'
import React, { Fragment, useEffect, useState } from 'react'
// Types
import type {
  AccountTypes,
  OfficeProductTypes,
  OrderTransactionTypes,
  OrderedProductTypes,
  PurchasedProductsTypes,
} from '@/types/index'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { format } from 'date-fns'
import { ShoppingCart } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import Filters from './Filters'
import ViewProducts from './ProductsModal'

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

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<OrderTransactionTypes[] | []>([])

  // Filters
  const [filterDate, setFilterDate] = useState<Date>(new Date())
  const [filterCustomer, setFilterCustomer] = useState<string | undefined>(
    undefined
  )
  const [filterCashier, setFilterCashier] = useState('All')

  // Confirm modal
  const [showConfirmModal, setShowConfirmModal] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const [perPageCount, setPerPageCount] = useState<number>(10)

  // Products modal
  const [showProductsModal, setShowProductsModal] = useState(false)
  const [products, setProducts] = useState<OrderedProductTypes[] | []>([])

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { supabase, session, currentUser } = useSupabase()
  const { setToast, hasAccess } = useFilter()

  const activeUser: AccountTypes = currentUser

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchOrderTransactions(
        {
          filterDate,
          filterCustomer,
          filterCashier,
          filterOffice: activeUser.active_office_id,
        },
        perPageCount,
        0
      )

      // update the list in redux
      dispatch(updateList(result.data))

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: result.data.length,
          results: result.count ? result.count : 0,
        })
      )
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Append data to existing list whenever 'show more' button is clicked
  const handleShowMore = async () => {
    setLoading(true)

    try {
      const result = await fetchOrderTransactions(
        {
          filterDate,
          filterCustomer,
          filterCashier,
          filterOffice: activeUser.active_office_id,
        },
        perPageCount,
        list.length
      )

      // update the list in redux
      const newList = [...list, ...result.data]
      dispatch(updateList(newList))

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: newList.length,
          results: result.count ? result.count : 0,
        })
      )
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleViewProducts = (products: OrderedProductTypes[]) => {
    setShowProductsModal(true)
    setProducts(products)
  }

  // display confirm modal
  const HandleConfirm = (action: string, id: number) => {
    if (action === 'CancelTransaction') {
      setConfirmMessage(
        'When you cancel this transaction, items will be returned to stock, Are you sure you want to cancel this transaction?'
      )
      setSelectedId(id)
    }
    setShowConfirmModal(action)
  }

  // based from confirm modal
  const HandleOnConfirm = () => {
    if (showConfirmModal === 'CancelTransaction') {
      void handleCancelTransaction()
    }

    setShowConfirmModal('')
    setConfirmMessage('')
    setSelectedId(null)
  }

  // based from confirm modal
  const handleOnCancel = () => {
    // hide the modal
    setShowConfirmModal('')
    setConfirmMessage('')
    setSelectedId(null)
  }

  const handleCancelTransaction = async () => {
    try {
      const purchasedProducts: PurchasedProductsTypes[] | undefined = list.find(
        (item) => item.id === selectedId
      )?.products_ordered

      const pIds: number[] = []
      purchasedProducts?.forEach((pp) => {
        pIds.push(pp.product_id)
      })

      // Get all in-stock products matching transfered products
      const { data: inStockProductsData } = await supabase
        .from('agriko_office_products')
        .select()
        .eq('office_id', activeUser.active_office_id)
        .in('product_id', pIds)

      const inStockProducts: OfficeProductTypes[] | [] = inStockProductsData

      // Find purchased product that exist in in-stock products
      const upsertArray: UpsertArrayTypes[] = []
      const insertLogArray: InsertLogArray[] = []
      purchasedProducts?.forEach((pp) => {
        const inStockProduct = inStockProducts.find(
          (s) => s.product_id.toString() === pp.product_id.toString()
        )

        if (inStockProduct) {
          // Upsert
          upsertArray.push({
            id: inStockProduct.id,
            quantity: Number(inStockProduct.quantity) + Number(pp.quantity),
          })
          // Insert log array
          insertLogArray.push({
            log: [],
            user_id: session.user.id,
            office_product_id: inStockProduct.id,
            custom_message: `${pp.quantity} items returned to stock due to order cancelation.`,
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
          'Return Products Upsert',
          'agriko_office_products',
          JSON.stringify(upsertArray),
          'Return Products Upsert error'
        )
        setToast('error', 'Saving failed, please reload the page.')
        throw new Error(error2.message)
      }

      // Create logs
      if (insertLogArray.length > 0) {
        await supabase.from('agriko_change_logs').insert(insertLogArray)
      }

      // Update transaction status
      const { error: error3 } = await supabase
        .from('agriko_order_transactions')
        .update({ status: 'Canceled' })
        .eq('id', selectedId)

      if (error3) throw new Error(error3.message)

      // Update ordered products status
      const { error: error4 } = await supabase
        .from('agriko_ordered_products')
        .update({ status: 'Canceled' })
        .eq('transaction_id', selectedId)

      if (error4) throw new Error(error4.message)

      // Update data in redux
      const items = [...globallist]
      const foundIndex = items.findIndex((x) => x.id === selectedId)
      items[foundIndex] = { ...items[foundIndex], status: 'Canceled' }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'In-stock Product Inventory updated.')
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    setList(globallist)
  }, [globallist])

  // Fetch data
  useEffect(() => {
    setList([])
    void fetchData()
  }, [filterDate, filterCustomer, filterCashier, perPageCount])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  // Check access from permission settings or Super Admins
  if (!hasAccess('collections') && !superAdmins.includes(session.user.email))
    return <Unauthorized />

  return (
    <>
      <Sidebar>
        <MainSideBar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Purchased Transactions" />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <Filters
              setFilterDate={setFilterDate}
              setFilterCustomer={setFilterCustomer}
              setFilterCashier={setFilterCashier}
            />
          </div>

          {/* Per Page */}
          <PerPage
            showingCount={resultsCounter.showing}
            resultsCount={resultsCounter.results}
            perPageCount={perPageCount}
            setPerPageCount={setPerPageCount}
          />

          {/* Main Content */}
          <div>
            <table className="app__table">
              <thead className="app__thead">
                <tr>
                  <th className="app__th pl-4"></th>
                  <th className="hidden md:table-cell app__th pl-4">
                    <div className="pl-4">Date Purchased</div>
                  </th>
                  <th className="hidden md:table-cell app__th">Customer</th>
                  <th className="hidden md:table-cell app__th">Total Amount</th>
                  <th className="hidden md:table-cell app__th"></th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  list.map((item: OrderTransactionTypes, index) => (
                    <tr
                      key={index}
                      className="app__tr">
                      <td className="w-6 pl-4 app__td">
                        <Menu
                          as="div"
                          className="app__menu_container">
                          <div>
                            <Menu.Button className="app__dropdown_btn">
                              <ChevronDownIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </Menu.Button>
                          </div>

                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95">
                            <Menu.Items className="app__dropdown_items">
                              <div className="py-1">
                                <Menu.Item>
                                  <div
                                    onClick={() =>
                                      handleViewProducts(
                                        item.agriko_ordered_products!
                                      )
                                    }
                                    className="app__dropdown_item">
                                    <ShoppingCart className="w-4 h-4" />
                                    <span>View Products</span>
                                  </div>
                                </Menu.Item>
                                {item.status !== 'Canceled' && (
                                  <Menu.Item>
                                    <div className="app__dropdown_item !cursor-default">
                                      <CustomButton
                                        containerStyles="app__btn_red_xs"
                                        title="Cancel Transaction"
                                        btnType="button"
                                        handleClick={() =>
                                          HandleConfirm(
                                            'CancelTransaction',
                                            item.id!
                                          )
                                        }
                                      />
                                    </div>
                                  </Menu.Item>
                                )}
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                      <td className="app__td">
                        <div className="pl-4">
                          {format(
                            new Date(item.transaction_date),
                            'MMMM dd, yyyy'
                          )}
                        </div>
                        {/* Mobile View */}
                        <div className="md:hidden pl-4 mt-2 space-y-2">
                          <div>
                            <span className="app_td_mobile_label">
                              Customer:
                            </span>{' '}
                            {item.customer?.name}
                          </div>
                          <div>
                            <span className="app_td_mobile_label">
                              Total Amount:
                            </span>{' '}
                            {item.total_amount}
                          </div>
                          <div className="space-x-2">
                            <CustomButton
                              containerStyles="app__btn_blue_xs"
                              title="Purchased Products"
                              btnType="button"
                              handleClick={() =>
                                handleViewProducts(
                                  item.agriko_ordered_products!
                                )
                              }
                            />
                          </div>
                        </div>
                        {/* End Mobile View */}
                      </td>
                      <td className="hidden md:table-cell app__td">
                        {item.customer?.name}
                      </td>
                      <td className="hidden md:table-cell app__td">
                        {item.total_amount}
                      </td>
                      <td className="hidden md:table-cell app__td">
                        {item.status === 'Canceled' && (
                          <span className="app__status_container_red">
                            Canceled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                {loading && (
                  <TableRowLoading
                    cols={5}
                    rows={2}
                  />
                )}
              </tbody>
            </table>
            {!loading && isDataEmpty && (
              <div className="app__norecordsfound">No records found.</div>
            )}
          </div>

          {/* Show More */}
          {resultsCounter.results > resultsCounter.showing && !loading && (
            <ShowMore handleShowMore={handleShowMore} />
          )}
        </div>
      </div>
      {/* Products Modal */}
      {showProductsModal && (
        <ViewProducts
          products={products}
          hideModal={() => {
            setShowProductsModal(false)
          }}
        />
      )}
      {/* Action Confirmation Modal */}
      {showConfirmModal !== '' && (
        <ConfirmModal
          header="Confirmation"
          btnText="Confirm"
          message={confirmMessage}
          onConfirm={HandleOnConfirm}
          onCancel={handleOnCancel}
        />
      )}
    </>
  )
}
export default Page
