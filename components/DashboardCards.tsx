/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { Title } from '@/components/index'
import { useSupabase } from '@/context/SupabaseProvider'
import type { RawMaterialTypes } from '@/types'
import { useEffect, useState } from 'react'

export default function DashboardCards() {
  const { supabase } = useSupabase()
  const [list, setList] = useState<RawMaterialTypes[] | null>(null)

  useEffect(() => {
    // Fetch raw materials
    ;(async () => {
      const { data } = await supabase.from('agriko_rawmaterials').select()
      if (data) {
        setList(data)
      }
    })()
  }, [])

  return (
    <div className="space-y-2">
      <div className="app__title">
        <Title title="Raw Materials Inventory" />
      </div>
      {list?.map((item, index) => (
        <div
          key={index}
          className={`inline-flex mr-2 mt-2 border border-gray-400 p-2 rounded-xl bg-white`}>
          <div className="flex flex-col items-center space-y-2">
            <div className="items-center font-medium">{item.name}</div>
            <div
              className={`flex font-bold items-center justify-center text-xl w-[150px] ${
                Number(item.quantity_warning) < Number(item.quantity)
                  ? 'text-red-600'
                  : 'text-gray-800'
              }`}>
              {item.quantity} {item.unit}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
