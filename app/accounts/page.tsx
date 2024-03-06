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
  UserBlock,
} from '@/components/index'
import { superAdmins } from '@/constants'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { fetchAccounts } from '@/utils/fetchApi'
import { Menu, Transition } from '@headlessui/react'
import React, { Fragment, useEffect, useState } from 'react'
// Types
import type { AccountTypes } from '@/types/index'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { ChevronDownIcon, PencilSquareIcon } from '@heroicons/react/20/solid'
import { useDispatch, useSelector } from 'react-redux'
import AddEdit from './AddEdit'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<AccountTypes[]>([])

  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedId, setSelectedId] = useState<string>('')
  const [editData, setEditData] = useState<AccountTypes | null>(null)

  const [filterUser, setFilterUser] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  const [perPageCount, setPerPageCount] = useState<number>(10)

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
      const result = await fetchAccounts(
        { filterUser, filterStatus },
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
      const result = await fetchAccounts(
        { filterUser, filterStatus },
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

  const handleAdd = () => {
    setShowAddModal(true)
    setEditData(null)
  }

  const handleEdit = (item: AccountTypes) => {
    setShowAddModal(true)
    setEditData(item)
  }

  // display confirm modal
  const HandleConfirm = (action: string, id: string) => {
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
    setSelectedId('')
  }

  // based from confirm modal
  const handleOnCancel = () => {
    // hide the modal
    setShowConfirmModal('')
    setConfirmMessage('')
    setSelectedId('')
  }

  const handleInactiveChange = async () => {
    try {
      const { error } = await supabase
        .from('agriko_users')
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
        .from('agriko_users')
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

  useEffect(() => {
    setList(globallist)
  }, [globallist])

  // Fetch data
  useEffect(() => {
    setList([])
    void fetchData()
  }, [filterUser, perPageCount, filterStatus])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  // Check access from permission settings or Super Admins
  if (!hasAccess('superadmin') && !superAdmins.includes(session.user.email))
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
            <Title title="Employee Accounts" />
            {!loading && (
              <CustomButton
                containerStyles="app__btn_green"
                title="Add New Employee"
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
                  <th className="hidden md:table-cell app__th pl-4"></th>
                  <th className="hidden md:table-cell app__th">Name</th>
                  <th className="hidden md:table-cell app__th">Email</th>
                  <th className="hidden md:table-cell app__th">
                    Login PassKey
                  </th>
                  <th className="hidden md:table-cell app__th">Office</th>
                  <th className="hidden md:table-cell app__th">Status</th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  list.map((item: AccountTypes, index) => (
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
                                  <div className="app__dropdown_item !cursor-default">
                                    {item.status === 'Active' && (
                                      <CustomButton
                                        containerStyles="app__btn_red_xs"
                                        title="Deactivate"
                                        btnType="button"
                                        handleClick={() =>
                                          HandleConfirm('Deactivate', item.id)
                                        }
                                      />
                                    )}
                                    {item.status === 'Inactive' && (
                                      <CustomButton
                                        containerStyles="app__btn_green_xs"
                                        title="Activate"
                                        btnType="button"
                                        handleClick={() =>
                                          HandleConfirm('Activate', item.id)
                                        }
                                      />
                                    )}
                                  </div>
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                      <th className="app__th_firstcol">
                        <UserBlock user={item} />
                        {/* Mobile View */}
                        <div>
                          <div className="md:hidden app__td_mobile">
                            <div>
                              <span className="app_td_mobile_label">
                                Email:
                              </span>{' '}
                              {item.email}
                            </div>
                            <div>
                              <span className="app_td_mobile_label">
                                Login PassKey:
                              </span>{' '}
                              {item.temp_password}
                            </div>
                            <div>{item.office.name}</div>
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
                              {item.status === 'Active' && (
                                <CustomButton
                                  containerStyles="app__btn_red_xs"
                                  title="Deactivate"
                                  btnType="button"
                                  handleClick={() =>
                                    HandleConfirm('Deactivate', item.id)
                                  }
                                />
                              )}
                              {item.status === 'Inactive' && (
                                <CustomButton
                                  containerStyles="app__btn_green_xs"
                                  title="Activate"
                                  btnType="button"
                                  handleClick={() =>
                                    HandleConfirm('Activate', item.id)
                                  }
                                />
                              )}
                            </div>
                          </div>
                        </div>
                        {/* End - Mobile View */}
                      </th>
                      <td className="hidden md:table-cell app__td">
                        <div>{item.email}</div>
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <div>{item.temp_password}</div>
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <div>{item.office.name}</div>
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
                    </tr>
                  ))}
                {loading && (
                  <TableRowLoading
                    cols={6}
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
        <AddEdit
          editData={editData}
          hideModal={() => setShowAddModal(false)}
        />
      )}
      {/* Add/Edit Modal */}
      {/* {showAddModal && (
        <AddEditModal
          editData={editData}
          hideModal={() => setShowAddModal(false)}
        />
      )} */}
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
