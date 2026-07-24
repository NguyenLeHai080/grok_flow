import { CAvatar, CButton } from '@coreui/react'
import { NavLink } from 'react-router-dom'
import { FiChevronDown, FiLogOut, FiZap } from 'react-icons/fi'
import useAuth from '../../modules/auth/useAuth'
import {
  grok2apiDocsNavigation,
  grok2apiNavigation,
  primaryNavigation,
  secondaryNavigation,
} from '../navigation'

function NavigationLinks({ items, onNavigate }) {
  return items.map(({ path, icon: Icon, label, end }) => (
    <NavLink key={path} to={path} end={end} onClick={onNavigate}>
      <Icon />
      {label}
    </NavLink>
  ))
}

export default function AppSidebar({ mobileOpen, grok2apiOpen, onClose, onToggleGrok2api }) {
  const { user, logout } = useAuth()

  return (
    <>
      <button
        type="button"
        className={`sidebar-overlay ${mobileOpen ? 'is-visible' : ''}`}
        onClick={onClose}
        aria-label={'\u0110\u00f3ng menu'}
      />
      <aside className={`sidebar show ${mobileOpen ? 'is-mobile-open' : ''}`}>
        <div className="brand">
          <span>
            <FiZap />
          </span>
          Groks
        </div>
        <small>CONTROL CENTER</small>
        <nav>
          <NavigationLinks items={primaryNavigation} onNavigate={onClose} />
          <div className={`sidebar-group ${grok2apiOpen ? 'is-open' : 'is-closed'}`}>
            <button
              type="button"
              className="sidebar-group-title"
              onClick={onToggleGrok2api}
              aria-expanded={grok2apiOpen}
            >
              <span>
                <FiZap /> Grok2API
              </span>
              <span className="sidebar-group-meta">
                <small>INTERNAL</small>
                <FiChevronDown />
              </span>
            </button>
            <div className="sidebar-group-content">
              <div className="sidebar-subnav">
                <NavigationLinks items={grok2apiNavigation} onNavigate={onClose} />
              </div>
              <div className="sidebar-doc-label">{'T\u00c0I LI\u1ec6U'}</div>
              <div className="sidebar-subnav">
                <NavigationLinks items={grok2apiDocsNavigation} onNavigate={onClose} />
              </div>
            </div>
          </div>
          <NavigationLinks items={secondaryNavigation} onNavigate={onClose} />
        </nav>
        <div className="sidebar-user">
          <CAvatar color="primary" textColor="white">
            {user?.full_name?.[0]}
          </CAvatar>
          <div>
            <b>{user?.full_name}</b>
            <span>{user?.role}</span>
          </div>
          <CButton
            color="link"
            onClick={logout}
            aria-label={'\u0110\u0103ng xu\u1ea5t'}
            title={'\u0110\u0103ng xu\u1ea5t'}
          >
            <FiLogOut />
          </CButton>
        </div>
      </aside>
    </>
  )
}
