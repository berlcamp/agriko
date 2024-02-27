/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { UserBlock } from '@/components/index'
import { useSupabase } from '@/context/SupabaseProvider'
import { LogMessageTypes, LogsTypes } from '@/types'
import { format } from 'date-fns'
import { nanoid } from 'nanoid'
import { useEffect, useRef, useState } from 'react'
import OneColLayoutLoading from './Loading/OneColLayoutLoading'

interface ModalProps {
  onClose: () => void
  refCol: string
  refValue: number
}

export default function LogsModal({ refCol, refValue, onClose }: ModalProps) {
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<LogsTypes[] | []>([])
  const wrapperRef = useRef<HTMLDivElement>(null)

  const { supabase } = useSupabase()

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [wrapperRef])

  useEffect(() => {
    setLoading(true)
    // fetch logs
    ;(async () => {
      const { data } = await supabase
        .from('agriko_change_logs')
        .select('*, user:user_id(firstname,middlename,lastname,avatar_url)')
        .eq(refCol, refValue)

      if (data) {
        setLogs(data)
      }

      setLoading(false)
    })()
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="app__modal_wrapper">
      <div className="app__modal_wrapper2_large">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">Change Logs</h5>
          </div>
          <div className="modal-body relative p-4">
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div className="w-full">
                <div className="text-gray-600 text-sm mb-1 dark:text-gray-300">
                  {loading ? (
                    <OneColLayoutLoading />
                  ) : (
                    <>
                      {logs.map((item, index) => (
                        <div
                          key={index}
                          className="mb-4 border-b pb-2">
                          <div className="flex items-center justify-start space-x-2">
                            <UserBlock user={item.user} />
                            <span className="text-xs">
                              (
                              {format(
                                new Date(item.created_at),
                                'MMM d, yyyy h:ii a'
                              )}
                              )
                            </span>
                          </div>
                          <div className="ml-6 mt-2 text-xs">
                            {item.log.map((i: LogMessageTypes) => (
                              <div key={nanoid()}>
                                Changed{' '}
                                <span className="font-bold">{i.field}</span>{' '}
                                from {i.old_value} to {i.new_value}
                              </div>
                            ))}
                            {item.custom_message}
                          </div>
                        </div>
                      ))}
                      {logs.length === 0 && (
                        <div className="mt-4 text-base">No logs found.</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="app__modal_footer">
              <button
                onClick={onClose}
                type="button"
                className="flex items-center bg-gray-500 hover:bg-gray-600 border border-gray-600 font-medium px-2 py-1 text-sm text-white rounded-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      asdf
    </div>
  )
}
