'use client'

import { useSupabase } from '@/context/SupabaseProvider'
import {
  AccountTypes,
  FinalProductTypes,
  OfficeProductTypes,
  RawMaterialTypes,
} from '@/types'
import { ChartBarIcon } from '@heroicons/react/20/solid'
import { ListChecks, ShoppingBasket, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function MainSideBar() {
  const currentRoute = usePathname()
  const { currentUser, supabase } = useSupabase()
  const activeUser: AccountTypes = currentUser

  // Counters
  const [incomingCount, setIncomingCount] = useState('')
  const [quantityAlertCount, setQuantityAlertCount] = useState('')
  const [rawAlertCount, setRawAlertCount] = useState('')
  const [finalProductAlertCount, setFinalProductAlertCount] = useState('')

  const officeCounter = async () => {
    // Incoming Products Counter
    const { count } = await supabase
      .from('agriko_transfer_transactions')
      .select('id', { count: 'exact' })
      .eq('status', 'To Receive')
      .eq('office_id', activeUser.active_office_id)

    if (count > 0) {
      setIncomingCount(count)
    }

    // In-stock products
    const { data: officeProductsData } = await supabase
      .from('agriko_office_products')
      .select('quantity, product:product_id(quantity_warning)')
      .eq('office_id', activeUser.active_office_id)

    let lowStocks = 0
    officeProductsData.forEach((ofp: OfficeProductTypes) => {
      if (Number(ofp.quantity) <= Number(ofp.product.quantity_warning)) {
        lowStocks++
      }
    })
    if (lowStocks > 0) {
      setQuantityAlertCount(lowStocks.toString())
    }
  }

  const warehouseCounter = async () => {
    // Raw Materials
    const { data: rawMaterialsData } = await supabase
      .from('agriko_rawmaterials')
      .select('quantity, quantity_warning')

    let lowRawStocks = 0
    rawMaterialsData.forEach((raw: RawMaterialTypes) => {
      if (Number(raw.quantity) <= Number(raw.quantity_warning)) {
        lowRawStocks++
      }
    })
    if (lowRawStocks > 0) {
      setRawAlertCount(lowRawStocks.toString())
    }

    // Final products
    const { data: finalProductsData } = await supabase
      .from('agriko_final_products')
      .select('quantity, product:product_id(quantity_warning)')

    let lowStocks = 0
    finalProductsData.forEach((ofp: FinalProductTypes) => {
      if (Number(ofp.quantity) <= Number(ofp.product.quantity_warning)) {
        lowStocks++
      }
    })
    if (lowStocks > 0) {
      setFinalProductAlertCount(lowStocks.toString())
    }
  }

  useEffect(() => {
    if (activeUser.active_office_id.toString() !== '1') {
      void officeCounter()
    }
    if (activeUser.active_office_id.toString() === '1') {
      void warehouseCounter()
    }
    console.log('Sidebar reloaded which has 4 different db queries loaded')
  }, [])

  return (
    <div className="px-2">
      {/* Hide if active office is Dumingag-Warehouse */}
      {activeUser.active_office_id.toString() !== '1' && (
        <>
          <ul className="space-y-2 border-gray-700">
            <li>
              <div className="flex items-center text-gray-500 font-semibold items-centers space-x-1 px-2">
                <ShoppingCart className="w-4 h-4" />
                <span>Point of Sale</span>
              </div>
            </li>
            <li>
              <Link
                href="/neworder"
                className={`app__menu_link ${
                  currentRoute === '/neworder' ? 'app_menu_link_active' : ''
                }`}>
                <span className="flex-1 ml-3 whitespace-nowrap">New Order</span>
              </Link>
            </li>
            <li>
              <Link
                href="/purchasetransactions"
                className={`app__menu_link ${
                  currentRoute === '/purchasetransactions'
                    ? 'app_menu_link_active'
                    : ''
                }`}>
                <span className="flex-1 ml-3 whitespace-nowrap">
                  Purchase Transactions
                </span>
              </Link>
            </li>
          </ul>
          <ul className="mt-8 space-y-2 border-gray-700">
            <li>
              <div className="flex items-center text-gray-500 font-semibold items-centers space-x-1 px-2">
                <ListChecks className="w-4 h-4" />
                <span>Inventory</span>
              </div>
            </li>
            <li>
              <Link
                href="/products"
                className={`app__menu_link ${
                  currentRoute === '/products' ? 'app_menu_link_active' : ''
                }`}>
                <span className="flex-1 ml-3 whitespace-nowrap">
                  In-stock Products
                </span>
                {quantityAlertCount !== '' && (
                  <span className="inline-flex items-center justify-center rounded-full bg-red-500 w-5 h-5">
                    <span className="text-white text-xs">
                      {quantityAlertCount}
                    </span>
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link
                href="/incomingproducts"
                className={`app__menu_link ${
                  currentRoute === '/incomingproducts'
                    ? 'app_menu_link_active'
                    : ''
                }`}>
                <span className="flex-1 ml-3 whitespace-nowrap">
                  Incoming Products
                </span>
                {incomingCount !== '' && (
                  <span className="inline-flex items-center justify-center rounded-full bg-red-500 w-5 h-5">
                    <span className="text-white text-xs">{incomingCount}</span>
                  </span>
                )}
              </Link>
            </li>
          </ul>
          <ul className="mt-8 space-y-2 border-gray-700">
            <li>
              <div className="flex items-center text-gray-500 font-semibold items-centers space-x-1 px-2">
                <ChartBarIcon className="w-4 h-4" />
                <span>Reports</span>
              </div>
            </li>
            <li>
              <Link
                href="/salessummary"
                className={`app__menu_link ${
                  currentRoute === '/salessummary' ? 'app_menu_link_active' : ''
                }`}>
                <span className="flex-1 ml-3 whitespace-nowrap">
                  Sales Summary
                </span>
              </Link>
            </li>
          </ul>
        </>
      )}
      {/* Dumingag-Warehouse access only */}
      {activeUser.active_office_id.toString() === '1' && (
        <>
          <ul className="space-y-2 border-gray-700">
            <li>
              <div className="flex items-center text-gray-500 font-semibold items-centers space-x-1 px-2">
                <ListChecks className="w-4 h-4" />
                <span>Production Inventory</span>
              </div>
            </li>
            <li>
              <Link
                href="/rawmaterials"
                className={`app__menu_link ${
                  currentRoute === '/rawmaterials' ? 'app_menu_link_active' : ''
                }`}>
                <span className="flex-1 ml-3 whitespace-nowrap">
                  Raw Materials
                </span>
                {rawAlertCount !== '' && (
                  <span className="inline-flex items-center justify-center rounded-full bg-red-500 w-5 h-5">
                    <span className="text-white text-xs">{rawAlertCount}</span>
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link
                href="/finalproducts"
                className={`app__menu_link ${
                  currentRoute === '/finalproducts'
                    ? 'app_menu_link_active'
                    : ''
                }`}>
                <span className="flex-1 ml-3 whitespace-nowrap">
                  Final Products
                </span>
                {finalProductAlertCount !== '' && (
                  <span className="inline-flex items-center justify-center rounded-full bg-red-500 w-5 h-5">
                    <span className="text-white text-xs">
                      {finalProductAlertCount}
                    </span>
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link
                href="/transfertransactions"
                className={`app__menu_link ${
                  currentRoute === '/transfertransactions'
                    ? 'app_menu_link_active'
                    : ''
                }`}>
                <span className="flex-1 ml-3 whitespace-nowrap">
                  Transfer Transactions
                </span>
              </Link>
            </li>
          </ul>
          <ul className="mt-8 space-y-2 border-gray-700">
            <li>
              <div className="flex items-center text-gray-500 font-semibold items-centers space-x-1 px-2">
                <ShoppingBasket className="w-4 h-4" />
                <span>Production Settings</span>
              </div>
            </li>
            <li>
              <Link
                href="/productssettings"
                className={`app__menu_link ${
                  currentRoute === '/productssettings'
                    ? 'app_menu_link_active'
                    : ''
                }`}>
                <span className="flex-1 ml-3 whitespace-nowrap">
                  Products Settings
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/rawmaterialssettings"
                className={`app__menu_link ${
                  currentRoute === '/rawmaterialssettings'
                    ? 'app_menu_link_active'
                    : ''
                }`}>
                <span className="flex-1 ml-3 whitespace-nowrap">
                  Raw Materials Settings
                </span>
              </Link>
            </li>
          </ul>
        </>
      )}
    </div>
  )
}
