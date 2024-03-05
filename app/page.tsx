'use client'

import { MainSideBar, Sidebar, TopBar } from '@/components/index'
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
          <h1 className="font-bold text-4xl text-gray-700">Welcome back!</h1>
        </div>
        <div className="flex items-center justify-center relative">
          <Image
            src="/logo.png"
            width={320}
            height={320}
            priority={true}
            alt="Logo Agriko"
          />
        </div>
      </div>
    </>
  )
}
