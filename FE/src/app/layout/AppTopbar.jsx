import { FiMenu, FiSearch } from 'react-icons/fi'
import useAuth from '../../modules/auth/useAuth'

export default function AppTopbar({ onOpenMenu }) {
  const { user } = useAuth()

  return (
    <header className="topbar">
      <button
        type="button"
        className="mobile-menu"
        onClick={onOpenMenu}
        aria-label={'M\u1edf menu'}
      >
        <FiMenu />
      </button>
      <div className="search">
        <FiSearch />
        <input aria-label={'T\u00ecm ki\u1ebfm'} placeholder="Search [CTRL + K]" />
      </div>
      <div className="profile">
        <span className="status-dot" />
        {user?.email}
      </div>
    </header>
  )
}
