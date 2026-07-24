import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Outlet, useLocation } from 'react-router-dom'
import AppSidebar from './AppSidebar'
import AppTopbar from './AppTopbar'

const MENU_STORAGE_KEY = 'groks:grok2api-menu-open'

export default function AppLayout() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [grok2apiOpen, setGrok2apiOpen] = useState(() => {
    const stored = localStorage.getItem(MENU_STORAGE_KEY)
    return location.pathname.startsWith('/grok2api') || stored !== 'false'
  })

  useEffect(() => {
    document.body.classList.toggle('sidebar-mobile-open', mobileOpen)
    return () => document.body.classList.remove('sidebar-mobile-open')
  }, [mobileOpen])

  const toggleGrok2api = () => {
    setGrok2apiOpen((current) => {
      const next = !current
      localStorage.setItem(MENU_STORAGE_KEY, String(next))
      return next
    })
  }

  const sidebar = (
    <AppSidebar
      mobileOpen={mobileOpen}
      grok2apiOpen={grok2apiOpen}
      onClose={() => setMobileOpen(false)}
      onToggleGrok2api={toggleGrok2api}
    />
  )

  return (
    <div className="app-shell">
      {createPortal(sidebar, document.body)}
      <section className="main-area">
        <AppTopbar onOpenMenu={() => setMobileOpen(true)} />
        <main className="page-content">
          <Outlet />
        </main>
      </section>
    </div>
  )
}
