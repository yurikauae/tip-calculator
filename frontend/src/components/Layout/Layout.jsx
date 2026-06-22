import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import DisclaimerBanner from '../common/DisclaimerBanner'
import useStore from '../../store/useStore'

export default function Layout() {
  const { settings } = useStore()

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <Header />

        {/* Disclaimer Banner */}
        {settings.showDisclaimerBanner && <DisclaimerBanner />}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-bg-primary">
          <div className="p-4 lg:p-6 min-h-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
