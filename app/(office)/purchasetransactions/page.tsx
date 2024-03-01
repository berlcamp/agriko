/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import {
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
import { fetchOrderTransactions } from '@/utils/fetchApi'
import React, { useEffect, useState } from 'react'
// Types
import type {
  AccountTypes,
  OrderTransactionTypes,
  OrderedProductTypes,
} from '@/types/index'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { format } from 'date-fns'
import { useDispatch, useSelector } from 'react-redux'
import Filters from './Filters'
import ViewProducts from './ProductsModal'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<OrderTransactionTypes[] | []>([])

  // Filters
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined)
  const [filterCustomer, setFilterCustomer] = useState<string | undefined>(
    undefined
  )

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

  useEffect(() => {
    setList(globallist)
  }, [globallist])

  // Fetch data
  useEffect(() => {
    setList([])
    void fetchData()
  }, [filterDate, filterCustomer, perPageCount])

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
                        <CustomButton
                          containerStyles="app__btn_blue_xs"
                          title="Purchased Products"
                          btnType="button"
                          handleClick={() =>
                            handleViewProducts(item.agriko_ordered_products!)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                {loading && (
                  <TableRowLoading
                    cols={4}
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
    </>
  )
}
export default Page
