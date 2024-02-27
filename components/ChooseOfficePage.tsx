'use client'
import { AccountTypes, OfficeTypes } from '@/types'
import { createBrowserClient } from '@supabase/ssr'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ChooseOfficePage({
  currUser,
  sysOffices,
}: {
  currUser: AccountTypes
  sysOffices: OfficeTypes[]
}) {
  const router = useRouter()

  const filteredOffices = sysOffices.filter((obj) =>
    currUser.offices.includes(obj.id)
  )

  const handleSwitchOffice = async (officeId: string) => {
    const { error } = await supabase
      .from('agriko_users')
      .update({ active_office_id: officeId })
      .eq('id', currUser.id)

    if (error) {
      toast.error('Error occured, please reload the page or contact Berl.')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <>
      <div className="">
        <div className="app__modal_wrapper">
          <div className="app__modal_wrapper2">
            <div className="app__modal_wrapper3">
              <div className="modal-body relative p-4">
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div className="w-full flex-col items-center">
                    <div className="flex justify-center">
                      <Image
                        src="/logo.png"
                        width={120}
                        height={32}
                        objectFit="cover"
                        alt="Logo Agriko"
                      />
                    </div>
                    <div className="flex justify-center">
                      <h1 className="text-base font-light">Choose Office</h1>
                    </div>
                    <div className="mt-4 flex flex-col items-center justify-center space-y-2">
                      {filteredOffices.map((office, index) => (
                        <div
                          key={index}
                          onClick={() => handleSwitchOffice(office.id)}
                          className="flex items-center space-x-1 rounded-lg cursor-pointer bg-gray-200 hover:bg-gray-300 px-2 py-1">
                          <span className="text-base font-semibold">
                            {office.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
