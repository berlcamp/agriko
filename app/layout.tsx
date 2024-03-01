import { Providers } from '@/GlobalRedux/provider'
import { FilterProvider } from '@/context/FilterContext'
import SupabaseProvider from '@/context/SupabaseProvider'
import SupabaseListener from '@/utils/supabase-listener'
import { createServerClient } from '@/utils/supabase-server'
import { Toaster } from 'react-hot-toast'
import 'server-only'
import './globals.css'

import LandingPage from '@/components/LandingPage'
import type { AccountTypes, OfficeTypes, UserAccessTypes } from '@/types/index'
import { logError } from '@/utils/fetchApi'
import type { Metadata } from 'next'

import ChooseOfficePage from '@/components/ChooseOfficePage'
import ErrorPage from '@/components/ErrorPage'
// import { Inter } from 'next/font/google'
// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Agriko',
  description: 'By BTC',
}

// do not cache this layout
export const revalidate = 0

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  let sysUsers: AccountTypes[] | null = []
  let sysAccess: UserAccessTypes[] | null = []
  let currUser: AccountTypes | null = null
  let sysOffices: OfficeTypes[] | null = []

  if (session) {
    try {
      const { data: systemAccess, error } = await supabase
        .from('agriko_system_access')
        .select()

      if (error) {
        void logError(
          'root layout system access',
          'agriko_system_access',
          '',
          'root layout system access error'
        )
        console.log('Error #: 1', error.message)
        throw new Error(error.message)
      }

      const { data: systemUsers, error: error2 } = await supabase
        .from('agriko_users')
        .select()
        .eq('status', 'Active')

      if (error2) {
        void logError('root layout agriko_users', 'agriko_users', '', '')
        console.log('Error #: 2')
        throw new Error(error2.message)
      }

      const { data: offices, error: error3 } = await supabase
        .from('agriko_offices')
        .select()
        .eq('status', 'Active')

      if (error3) {
        void logError(
          'root layout agriko_offices',
          'agriko_offices',
          '',
          error3.message
        )
        console.log('Error #: 3')
        throw new Error(error3.message)
      }

      const { data: user, error: error4 } = await supabase
        .from('agriko_users')
        .select()
        .eq('id', session.user.id)
        .limit(1)
        .maybeSingle()

      if (error4) {
        void logError(
          'root layout current user',
          'agriko_users',
          '',
          error4.message
        )
        console.log('Error #: 4')
        throw new Error(error4.message)
      }

      sysAccess = systemAccess
      sysUsers = systemUsers
      sysOffices = offices
      currUser = user
    } catch (err) {
      console.log('Root layout error:', err)
      return (
        <html lang="en">
          <body className={`relative bg-gray-800`}>
            <ErrorPage />
          </body>
        </html>
      )
    }

    if (currUser && sysOffices && !currUser.active_office_id) {
      return (
        <html lang="en">
          <body className={`relative bg-gray-800`}>
            <ChooseOfficePage
              currUser={currUser}
              sysOffices={sysOffices}
            />
          </body>
        </html>
      )
    }
  }

  return (
    <html lang="en">
      <body className={`relative bg-gray-200`}>
        <SupabaseProvider
          systemAccess={sysAccess}
          session={session}
          systemUsers={sysUsers}
          currentUser={currUser}
          systemOffices={sysOffices}>
          <SupabaseListener serverAccessToken={session?.access_token} />
          {!session && <LandingPage />}
          {session && (
            <Providers>
              <FilterProvider>
                <Toaster />
                {children}
              </FilterProvider>
            </Providers>
          )}
        </SupabaseProvider>
      </body>
    </html>
  )
}
