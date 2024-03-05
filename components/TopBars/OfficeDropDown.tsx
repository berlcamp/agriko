'use client'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { superAdmins } from '@/constants'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { AccountTypes, OfficeTypes } from '@/types'
import { logError } from '@/utils/fetchApi'
import { Check, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import OneColLayoutLoading from '../Loading/OneColLayoutLoading'

interface propTypes {
  darkMode?: boolean
}

const OfficeDropDown = ({ darkMode }: propTypes) => {
  const [loading, setLoading] = useState(false)
  const { currentUser, systemOffices, supabase, session } = useSupabase()
  const { setToast, hasAccess } = useFilter()

  const router = useRouter()

  const currUser: AccountTypes = currentUser
  const offices: OfficeTypes[] = systemOffices
  const filteredOffices: OfficeTypes[] = offices

  const office = offices.find((w) => w.id === currUser.active_office_id)

  const handleSwitchOffice = async (officeId: string) => {
    setLoading(true)

    const { error } = await supabase
      .from('agriko_users')
      .update({ active_office_id: officeId })
      .eq('id', session.user.id)

    if (error) {
      void logError('Switch office', 'agriko_users', '', error.message)
      setToast(
        'error',
        'Saving failed, please reload the page or contact Berl.'
      )
    }

    router.push('/')
    router.refresh()
  }

  useEffect(() => {
    setLoading(false)
  }, [session])

  return (
    <>
      <div className="relative inline-block mr-4">
        {!hasAccess('superadmin') &&
          !superAdmins.includes(session.user.email) && (
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-600">Office:</span>
              <div className="flex items-center justify-between space-x-2 text-sm px-2 py-1 border rounded-md font-bold text-gray-700">
                <span>{office?.name}</span>
              </div>
            </div>
          )}
        {(hasAccess('superadmin') ||
          superAdmins.includes(session.user.email)) && (
          <Popover>
            <PopoverTrigger>
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-600">Office:</span>
                <div className="flex items-center justify-between space-x-2 text-sm px-2 py-1 border rounded-md font-bold text-gray-700">
                  <span>{office?.name}</span>
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent>
              <div className="space-y-1">
                {loading ? (
                  <OneColLayoutLoading />
                ) : (
                  <>
                    {filteredOffices.map((w, index) => (
                      <React.Fragment key={index}>
                        {w.id === currUser.active_office_id ? (
                          <div className="flex items-center space-x-1 rounded-lg hover:bg-gray-100 px-2 py-1">
                            <div className="flex items-center justify-between space-x-2 text-sm font-bold text-green-800">
                              <span>{w.name}</span>
                              <Check className="w-5 h-5" />
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleSwitchOffice(w.id)}
                            className="flex items-center space-x-1 rounded-lg cursor-pointer hover:bg-gray-100 px-2 py-1">
                            <span className="text-sm">{w.name}</span>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </>
  )
}
export default OfficeDropDown
