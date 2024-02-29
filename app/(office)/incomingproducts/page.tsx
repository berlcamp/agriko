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
import { fetchTransfers, logError } from '@/utils/fetchApi'
import React, { useEffect, useState } from 'react'
// Types
import type {
  AccountTypes,
  OfficeProductTypes,
  TransferTransactionTypes,
  TransferedProductTypes,
} from '@/types/index'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { format } from 'date-fns'
import { useDispatch, useSelector } from 'react-redux'
import ProductsModal from './ProductsModal'

interface InsertArrayTypes {
  product_id: number
  office_id: string
  quantity: number
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

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [list, setList] = useState<TransferTransactionTypes[]>([])

  const [perPageCount, setPerPageCount] = useState<number>(10)

  // Products modal
  const [showProductsModal, setShowProductsModal] = useState(false)
  const [products, setProducts] = useState<TransferedProductTypes[] | []>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Confirm modal
  const [showConfirmModal, setShowConfirmModal] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')

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
      const result = await fetchTransfers(
        { filterOffice: activeUser.active_office_id },
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
      const result = await fetchTransfers({}, perPageCount, list.length)

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

  // display confirm modal
  const HandleConfirm = (action: string, id: number) => {
    if (action === 'Receive') {
      setConfirmMessage(
        'Receiving these products will update the "In-Stock Products" Inventory, please confirm.'
      )
      setSelectedId(id)
    }
    setShowConfirmModal(action)
  }

  // based from confirm modal
  const HandleOnConfirm = async () => {
    setSaving(true)
    if (showConfirmModal === 'Receive') {
      await handleReceiveProducts()
    }

    setShowConfirmModal('')
    setConfirmMessage('')
    setSelectedId(null)
    setSaving(false)
  }

  // based from confirm modal
  const handleOnCancel = () => {
    // hide the modal
    setShowConfirmModal('')
    setConfirmMessage('')
    setSelectedId(null)
  }

  const handleReceiveProducts = async () => {
    try {
      const transferedProducts: TransferedProductTypes[] | undefined =
        list.find((item) => item.id === selectedId)?.products

      const pIds: number[] = []
      transferedProducts?.forEach((p) => {
        pIds.push(p.product_id)
      })

      // Get all in-stock products matching transfered products
      const { data: inStockProductsData } = await supabase
        .from('agriko_office_products')
        .select()
        .eq('office_id', activeUser.active_office_id)
        .in('product_id', pIds)

      const inStockProducts: OfficeProductTypes[] | [] = inStockProductsData

      // Find transfered product that exist in in-stock products, if it exist create upsertArray otherwise create insertArray
      const insertArray: InsertArrayTypes[] = []
      const upsertArray: UpsertArrayTypes[] = []
      const insertLogArray: InsertLogArray[] = []
      transferedProducts?.forEach((transferedProduct) => {
        const inStockProduct = inStockProducts.find(
          (s) =>
            s.product_id.toString() === transferedProduct.product_id.toString()
        )

        if (inStockProduct) {
          // Upsert
          upsertArray.push({
            id: inStockProduct.id,
            quantity:
              Number(inStockProduct.quantity) +
              Number(transferedProduct.quantity),
          })
          // Insert log array
          insertLogArray.push({
            log: [],
            user_id: session.user.id,
            office_product_id: inStockProduct.id,
            custom_message: `Received ${transferedProduct.quantity} products from Dumingag-Warehouse.`,
          })
        } else {
          // Insert
          insertArray.push({
            product_id: transferedProduct.product_id,
            office_id: activeUser.active_office_id,
            quantity: Number(transferedProduct.quantity),
          })
        }
      })

      // Execut insert
      const { error } = await supabase
        .from('agriko_office_products')
        .insert(insertArray)

      if (error) {
        void logError(
          'Receive Products Insert',
          'agriko_office_products',
          JSON.stringify(insertArray),
          'Insert error'
        )
        setToast(
          'error',
          'Saving failed, please reload the page or contact Berl.'
        )
        throw new Error(error.message)
      }

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

      // Update transaction status
      const { error: error3 } = await supabase
        .from('agriko_transfer_transactions')
        .update({ status: 'Received' })
        .eq('id', selectedId)

      if (error3) {
        void logError(
          'Update trasactions status after Insert/Upsert',
          'agriko_transfer_transactions',
          '',
          ''
        )
      }

      // Update data in redux
      const items = [...globallist]
      const foundIndex = items.findIndex((x) => x.id === selectedId)
      items[foundIndex] = { ...items[foundIndex], status: 'Received' }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'In-stock Product Inventory updated.')
    } catch (e) {
      console.error(e)
    }
  }

  const handleViewProducts = (products: TransferedProductTypes[]) => {
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
  }, [perPageCount])

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
            <Title title="Incoming Products" />
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
                    <div className="pl-4">Date Transfered</div>
                  </th>
                  <th className="hidden md:table-cell app__th">Memo</th>
                  <th className="hidden md:table-cell app__th">Status</th>
                  <th className="hidden md:table-cell app__th"></th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  list.map((item: TransferTransactionTypes, index) => (
                    <tr
                      key={index}
                      className="app__tr">
                      <td className="app__td">
                        <div className="pl-4">
                          {format(
                            new Date(item.transfer_date),
                            'MMMM dd, yyyy'
                          )}
                        </div>
                        {/* Mobile View */}
                        <div className="md:hidden pl-4 mt-2 space-y-2">
                          <div>
                            <span className="app_td_mobile_label">Memo:</span>{' '}
                            {item.memo}
                          </div>
                          <div>
                            {item.status === 'Received' ? (
                              <span className="app__status_container_green">
                                Received
                              </span>
                            ) : (
                              <span className="app__status_container_orange">
                                {item.status}
                              </span>
                            )}
                          </div>
                          <div className="space-x-2">
                            <CustomButton
                              containerStyles="app__btn_green_xs"
                              title="Receive and Move to In-Stock Products"
                              btnType="button"
                              handleClick={() =>
                                handleViewProducts(item.products)
                              }
                            />
                            <CustomButton
                              containerStyles="app__btn_blue_xs"
                              title="View Products"
                              btnType="button"
                              handleClick={() =>
                                handleViewProducts(item.products)
                              }
                            />
                          </div>
                        </div>
                        {/* End Mobile View */}
                      </td>
                      <td className="hidden md:table-cell app__td">
                        {item.memo}
                      </td>
                      <td className="hidden md:table-cell app__td">
                        {item.status === 'Received' ? (
                          <span className="app__status_container_green">
                            Received
                          </span>
                        ) : (
                          <span className="app__status_container_orange">
                            {item.status}
                          </span>
                        )}
                      </td>
                      <td className="hidden md:table-cell app__td space-x-2">
                        {item.status === 'To Receive' && (
                          <CustomButton
                            containerStyles="app__btn_green_xs"
                            title="Receive and Move to In-Stock Products"
                            btnType="button"
                            handleClick={() =>
                              HandleConfirm('Receive', item.id)
                            }
                          />
                        )}
                        <CustomButton
                          containerStyles="app__btn_blue_xs"
                          title="View Products"
                          btnType="button"
                          handleClick={() => handleViewProducts(item.products)}
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
        <ProductsModal
          products={products}
          hideModal={() => {
            setShowProductsModal(false)
          }}
        />
      )}
      {/* Confirmation Modal */}
      {showConfirmModal !== '' && (
        <ConfirmModal
          header="Confirmation"
          btnText="Confirm"
          isDisabled={saving}
          message={confirmMessage}
          onConfirm={HandleOnConfirm}
          onCancel={handleOnCancel}
        />
      )}
    </>
  )
}
export default Page
