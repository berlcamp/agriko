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
import { fetchProducts } from '@/utils/fetchApi'
import { Menu, Transition } from '@headlessui/react'
import React, { Fragment, useEffect, useState } from 'react'
// Types
import type { ProductTypes, RawMaterialTypes } from '@/types/index'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { ChevronDownIcon, PencilSquareIcon } from '@heroicons/react/20/solid'
import { AlertTriangle } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import AddEditModal from './AddEditModal'
import RawMaterials from './RawMaterials'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<ProductTypes[]>([])

  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [editData, setEditData] = useState<ProductTypes | null>(null)

  const [perPageCount, setPerPageCount] = useState<number>(10)

  // Raw Materials modal
  const [showRawMaterialsModal, setShowRawMaterialsModal] = useState(false)
  const [rawMaterials, setRawMaterials] = useState<RawMaterialTypes[] | []>([])

  // Confirm modal
  const [showConfirmModal, setShowConfirmModal] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { supabase, session } = useSupabase()
  const { setToast, hasAccess } = useFilter()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchProducts(perPageCount, 0)

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
      const result = await fetchProducts(perPageCount, list.length)

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

  const handleAdd = () => {
    setShowAddModal(true)
    setEditData(null)
  }

  const handleEdit = (item: ProductTypes) => {
    setShowAddModal(true)
    setEditData(item)
  }

  // display confirm modal
  const HandleConfirm = (action: string, id: number) => {
    if (action === 'Activate') {
      setConfirmMessage('Are you sure you want to activate this user?')
      setSelectedId(id)
    }
    if (action === 'Deactivate') {
      setConfirmMessage('Are you sure you want to deactivate this user?')
      setSelectedId(id)
    }
    setShowConfirmModal(action)
  }

  // based from confirm modal
  const HandleOnConfirm = () => {
    if (showConfirmModal === 'Activate') {
      void handleActiveChange()
    }
    if (showConfirmModal === 'Deactivate') {
      void handleInactiveChange()
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

  const handleInactiveChange = async () => {
    try {
      const { error } = await supabase
        .from('agriko_products')
        .update({ status: 'Inactive' })
        .eq('id', selectedId)

      if (error) throw new Error(error.message)

      // Update data in redux
      const items = [...globallist]
      const foundIndex = items.findIndex((x) => x.id === selectedId)
      items[foundIndex] = { ...items[foundIndex], status: 'Inactive' }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')
    } catch (e) {
      console.error(e)
    }
  }

  const handleActiveChange = async () => {
    try {
      const { error } = await supabase
        .from('agriko_products')
        .update({ status: 'Active' })
        .eq('id', selectedId)

      if (error) throw new Error(error.message)

      // Update data in redux
      const items = [...globallist]
      const foundIndex = items.findIndex((x) => x.id === selectedId)
      items[foundIndex] = { ...items[foundIndex], status: 'Active' }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')
    } catch (e) {
      console.error(e)
    }
  }

  const handleViewRawMaterials = (items: RawMaterialTypes[]) => {
    setShowRawMaterialsModal(true)
    setRawMaterials(items)
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
  if (!hasAccess('products') && !superAdmins.includes(session.user.email))
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
            {/* Title */}
            <Title title="Product Settings" />
            {!loading && (
              <CustomButton
                containerStyles="app__btn_green"
                title="Add New Product"
                btnType="button"
                handleClick={handleAdd}
              />
            )}
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
                  <th className="app__th">Product Name</th>
                  <th className="hidden md:table-cell app__th">Size</th>
                  <th className="hidden md:table-cell app__th">Price</th>
                  <th className="hidden md:table-cell app__th">Category</th>
                  <th className="hidden md:table-cell app__th">Status</th>
                  <th className="hidden md:table-cell app__th"></th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  list.map((item: ProductTypes, index) => (
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
                                    onClick={() => handleEdit(item)}
                                    className="app__dropdown_item">
                                    <PencilSquareIcon className="w-4 h-4" />
                                    <span>Edit</span>
                                  </div>
                                </Menu.Item>
                                <Menu.Item>
                                  <>
                                    {item.status === 'Active' && (
                                      <div
                                        onClick={() =>
                                          HandleConfirm('Deactivate', item.id)
                                        }
                                        className="app__dropdown_item">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>Deactivate</span>
                                      </div>
                                    )}
                                    {item.status === 'Inactive' && (
                                      <div
                                        onClick={() =>
                                          HandleConfirm('Activate', item.id)
                                        }
                                        className="app__dropdown_item">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>Activate</span>
                                      </div>
                                    )}
                                  </>
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                      <th className="app__th_firstcol">
                        <div>{item.name}</div>
                        {/* Mobile View */}
                        <div>
                          <div className="md:hidden app__td_mobile">
                            <div>
                              <span className="app_td_mobile_label">Size:</span>{' '}
                              {item.size} {item.custom_size}
                            </div>
                            <div>
                              <span className="app_td_mobile_label">
                                Price:
                              </span>{' '}
                              {item.price}
                            </div>
                            <div>
                              <span className="app_td_mobile_label">
                                Category:
                              </span>{' '}
                              {item.category}
                            </div>
                            <div>
                              {item.status === 'Inactive' ? (
                                <span className="app__status_container_red">
                                  Inactive
                                </span>
                              ) : (
                                <span className="app__status_container_green">
                                  Active
                                </span>
                              )}
                            </div>
                            <div>
                              {item.raw_materials &&
                                item.raw_materials.length > 0 && (
                                  <CustomButton
                                    containerStyles="app__btn_blue_xs"
                                    title="View Raw Materials"
                                    btnType="button"
                                    handleClick={() =>
                                      handleViewRawMaterials(item.raw_materials)
                                    }
                                  />
                                )}
                            </div>
                          </div>
                        </div>
                        {/* End - Mobile View */}
                      </th>
                      <td className="hidden md:table-cell app__td">
                        <div>
                          {item.size === 'Custom Size' ? (
                            <span>{item.custom_size}</span>
                          ) : (
                            <span>{item.size}</span>
                          )}
                        </div>
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <div>{item.price}</div>
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <div>{item.category}</div>
                      </td>
                      <td className="hidden md:table-cell app__td">
                        {item.status === 'Inactive' ? (
                          <span className="app__status_container_red">
                            Inactive
                          </span>
                        ) : (
                          <span className="app__status_container_green">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="hidden md:table-cell app__td">
                        {item.raw_materials && item.raw_materials.length > 0 ? (
                          <CustomButton
                            containerStyles="app__btn_blue_xs"
                            title="View Raw Materials"
                            btnType="button"
                            handleClick={() =>
                              handleViewRawMaterials(item.raw_materials)
                            }
                          />
                        ) : (
                          <span className="text-gray-500 italic">
                            -No Raw Materials-
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                {loading && (
                  <TableRowLoading
                    cols={7}
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
      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddEditModal
          editData={editData}
          hideModal={() => setShowAddModal(false)}
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
      {/* Raw Materials Modal */}
      {showRawMaterialsModal && (
        <RawMaterials
          rawMaterials={rawMaterials}
          hideModal={() => {
            setShowRawMaterialsModal(false)
          }}
        />
      )}
    </>
  )
}
export default Page
