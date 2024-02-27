'use client'

import {
  Sidebar,
  MainSideBar,
  MainMenu,
  TopBar,
  DashboardCards,
  Title,
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
          <h1 className="font-bold text-4xl text-gray-700">Welcome Back!</h1>
        </div>
        <div className="flex items-center justify-center relative">
          <Image
            src="/logo.png"
            width={220}
            height={32}
            objectFit="cover"
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
