/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import {
  LogsModal,
  MainSideBar,
  Sidebar,
  Title,
  TopBar,
  Unauthorized,
} from '@/components/index'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { superAdmins } from '@/constants'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import type { RawMaterialTypes } from '@/types'
import { Menu, Transition } from '@headlessui/react'
import {
  ChevronDownIcon,
  EyeIcon,
  PencilSquareIcon,
  PlusCircleIcon,
} from '@heroicons/react/20/solid'
import { PlusCircledIcon } from '@radix-ui/react-icons'
import { LayoutGrid, List } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { Fragment, useEffect, useState } from 'react'
import AddEditModal from './AddEditModal'

const Page: React.FC = () => {
  const [viewType, setViewType] = useState('grid')
  const [list, setList] = useState<RawMaterialTypes[] | null>(null)
  const [refetch, setRefetch] = useState(false)
  const [addOrAdjust, setAddOrAdjust] = useState('')

  // loading state
  const [loading, setLoading] = useState(false)

  // change logs modal
  const [showLogsModal, setShowLogsModal] = useState(false)

  const [selectedProduct, setSelectedProduct] =
    useState<RawMaterialTypes | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const { supabase, session } = useSupabase()
  const { hasAccess } = useFilter()

  const router = useRouter()

  const handleAddQuantity = (product: RawMaterialTypes) => {
    setSelectedProduct(product)
    setShowAddModal(true)
    setAddOrAdjust('add')
  }

  const handleAdjustQuantity = (product: RawMaterialTypes) => {
    setSelectedProduct(product)
    setShowAddModal(true)
    setAddOrAdjust('adjust')
  }

  useEffect(() => {
    // Fetch products
    ;(async () => {
      setLoading(true)
      const { data: rawMaterials } = await supabase
        .from('agriko_rawmaterials')
        .select()
        .eq('status', 'Active')
        .order('name', { ascending: true })

      if (rawMaterials) {
        setList(rawMaterials)
      }
      setLoading(false)
    })()
  }, [refetch])

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
        {/* View Type */}
        <div className="mx-4 flex items-center space-x-3">
          <LayoutGrid
            onClick={() => setViewType('grid')}
            className={`${
              viewType === 'grid'
                ? 'w-8 h-8 bg-gray-400 p-1 rounded-lg cursor-pointer'
                : 'w-7 h-7 cursor-pointer'
            }`}
          />
          <List
            onClick={() => setViewType('list')}
            className={`${
              viewType === 'list'
                ? 'w-8 h-8 bg-gray-400 p-1 rounded-lg cursor-pointer'
                : 'w-7 h-7 cursor-pointer'
            }`}
          />
        </div>
        {loading && (
          <div>
            <TwoColTableLoading />
          </div>
        )}
        {!loading && (
          <>
            {/* Grid View */}
            {viewType === 'grid' && (
              <div>
                <div className="space-y-2">
                  <div className="app__title">
                    <Title title="Raw Materials Inventory" />
                  </div>
                  <div className="mx-4">
                    {list?.map((item, idx) => (
                      <div
                        key={idx}
                        className="app__product_grid_container">
                        <div className="app__product_grid_container_2">
                          <div className="app__product_grid_title">
                            {item.name} ({item.unit})
                          </div>
                          <div className="app__product_grid_content">
                            <span
                              onClick={() => handleAdjustQuantity(item)}
                              className="cursor-pointer">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <PencilSquareIcon className="w-5 h-5 text-gray-600" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-light">
                                      Adjust Quantity
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </span>
                            <span className="app__product_grid_quantity">
                              {item.quantity}
                            </span>
                            <span
                              onClick={() => handleAddQuantity(item)}
                              className="cursor-pointer">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <PlusCircledIcon className="w-5 h-5 text-green-700" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-light">Add Quantity</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* List View */}
            {viewType === 'list' && (
              <>
                <div className="app__title">
                  <Title title="Raw Materials Inventory" />
                </div>
                <div className="mt-2">
                  <table className="app__table">
                    <thead className="app__thead">
                      <tr>
                        <th className="app__th"></th>
                        <th className="app__th">Raw Material</th>
                        <th className="app__th">Unit</th>
                        <th className="app__th">Available Stocks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list?.map((item, idx) => (
                        <tr
                          key={idx}
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
                                        onClick={() => handleAddQuantity(item)}
                                        className="app__dropdown_item">
                                        <PlusCircleIcon className="w-4 h-4 text-green-700" />
                                        <span>Add Quantity</span>
                                      </div>
                                    </Menu.Item>
                                    <Menu.Item>
                                      <div
                                        onClick={() =>
                                          handleAdjustQuantity(item)
                                        }
                                        className="app__dropdown_item">
                                        <PencilSquareIcon className="w-4 h-4 text-gray-700" />
                                        <span>Adjust Quantity</span>
                                      </div>
                                    </Menu.Item>
                                    <Menu.Item>
                                      <div
                                        onClick={() => {
                                          setShowLogsModal(true)
                                          setSelectedProduct(item)
                                        }}
                                        className="app__dropdown_item">
                                        <EyeIcon className="w-4 h-4" />
                                        <span>View Change Logs</span>
                                      </div>
                                    </Menu.Item>
                                  </div>
                                </Menu.Items>
                              </Transition>
                            </Menu>
                          </td>
                          <th className="app__th_firstcol">
                            <div>{item.name}</div>
                          </th>
                          <td className="app__td">
                            <div>{item.unit}</div>
                          </td>
                          <td className="app__td">
                            <div>{item.quantity}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
      {/* Add/Edit Modal */}
      {showAddModal && selectedProduct && (
        <AddEditModal
          selectedProduct={selectedProduct}
          addOrAdjust={addOrAdjust}
          hideModal={() => {
            setShowAddModal(false)
            setRefetch(!refetch)
          }}
        />
      )}
      {/* Logs Modal */}
      {showLogsModal && selectedProduct && (
        <LogsModal
          refCol="raw_material_id"
          refValue={selectedProduct.id}
          onClose={() => {
            setShowLogsModal(false)
            setSelectedProduct(null)
          }}
        />
      )}
    </>
  )
}
export default Page
