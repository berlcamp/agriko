'use client'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { AccountTypes, OfficeTypes } from '@/types'
import { logError } from '@/utils/fetchApi'
import { useRouter } from 'next/navigation'
import React from 'react'

interface propTypes {
  darkMode?: boolean
}

const OfficeDropDown = ({ darkMode }: propTypes) => {
  const { currentUser, systemOffices, supabase, session } = useSupabase()
  const { setToast } = useFilter()

  const router = useRouter()

  const currUser: AccountTypes = currentUser
  const offices: OfficeTypes[] = systemOffices
  const filteredOffices: OfficeTypes[] = offices.filter((obj) =>
    currUser.offices.includes(obj.id)
  )

  const office = offices.find((w) => w.id === currUser.active_office_id)

  const handleSwitchOffice = async (officeId: string) => {
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

  return (
    <>
      <div className="relative inline-block mr-4">
        <Popover>
          <PopoverTrigger>
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-600">Office:</span>
              <span className="text-sm px-2 py-1 border rounded-md font-bold text-gray-700">
                {office?.name}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent>
            <div className="space-y-1">
              {filteredOffices.map((w, index) => (
                <React.Fragment key={index}>
                  {w.id === currUser.active_office_id ? (
                    <div className="flex items-center space-x-1 rounded-lg hover:bg-gray-100 px-2 py-1">
                      <span className="text-sm font-bold text-green-800">
                        {w.name}
                      </span>
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
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  )
}
export default OfficeDropDown