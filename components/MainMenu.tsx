'use client'
import { KeyIcon, UserIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'

export default function MainMenu() {
  return (
    <div className="py-1">
      <div className="px-4 py-4">
        <div className="text-gray-700 text-xl font-semibold">Settings</div>
        <div className="lg:flex space-x-2">
          <div className="px-2 py-4 mt-2 lg:w-96 border text-gray-600 rounded-lg bg-white shadow-md flex flex-col space-y-2">
            <Link href="/accounts">
              <div className="app__menu_item">
                <div className="pt-1">
                  <UserIcon className="w-8 h-8" />
                </div>
                <div>
                  <div className="app__menu_item_label">Employee Accounts</div>
                  <div className="app__menu_item_label_description">
                    Account Details
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/setting/system">
              <div className="app__menu_item">
                <div className="pt-1">
                  <KeyIcon className="w-8 h-8" />
                </div>
                <div>
                  <div className="app__menu_item_label">System Access</div>
                  <div className="app__menu_item_label_description">
                    System Access & Permissions
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
