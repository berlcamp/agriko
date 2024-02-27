'use client'

import { useSupabase } from '@/context/SupabaseProvider'
import { ListChecks, ShoppingBasket, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MainSideBar() {
  const currentRoute = usePathname()
  const { session } = useSupabase()

  return (
    <div className="px-2">
      <ul className="space-y-2 border-gray-700">
        <li>
          <div className="flex items-center text-gray-500 font-semibold items-centers space-x-1 px-2">
            <ShoppingCart className="w-4 h-4" />
            <span>Point of Sale</span>
          </div>
        </li>
        <li>
          <Link
            href="/order"
            className={`app__menu_link ${
              currentRoute === '/order' ? 'app_menu_link_active' : ''
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
            <span>Office Inventory</span>
          </div>
        </li>
        <li>
          <Link
            href="/rawmaterials"
            className={`app__menu_link ${
              currentRoute === '/rawmaterials' ? 'app_menu_link_active' : ''
            }`}>
            <span className="flex-1 ml-3 whitespace-nowrap">Products</span>
          </Link>
        </li>
      </ul>
      <ul className="mt-8 space-y-2 border-gray-700">
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
            <span className="flex-1 ml-3 whitespace-nowrap">Raw Materials</span>
          </Link>
        </li>
        <li>
          <Link
            href="/finalproducts"
            className={`app__menu_link ${
              currentRoute === '/finalproducts' ? 'app_menu_link_active' : ''
            }`}>
            <span className="flex-1 ml-3 whitespace-nowrap">Final Product</span>
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
              currentRoute === '/products' ? 'app_menu_link_active' : ''
            }`}>
            <span className="flex-1 ml-3 whitespace-nowrap">Products</span>
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
            <span className="flex-1 ml-3 whitespace-nowrap">Raw Materials</span>
          </Link>
        </li>
      </ul>
    </div>
  )
}
