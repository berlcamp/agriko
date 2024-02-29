'use client'

import {
  DashboardCards,
  MainSideBar,
  Sidebar,
  TopBar,
} from '@/components/index'
import Image from 'next/image'

export default function Page() {
  return (
    <>
      <Sidebar>
        <MainSideBar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div className="text-center">
          <h1 className="font-bold text-4xl text-gray-700">Welcome!</h1>
        </div>
        <div className="flex items-center justify-center relative">
          <Image
            src="/logo.png"
            width={220}
            height={220}
            priority={true}
            alt="Logo Agriko"
          />
        </div>

        <div className="mx-4">
          <DashboardCards />
        </div>
      </div>
    </>
  )
}
