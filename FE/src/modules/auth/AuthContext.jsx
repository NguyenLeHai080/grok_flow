import { useMemo, useState } from 'react'
import http from '../../shared/api/http'
import AuthContext from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem('user') || 'null'))
  const login = async (credentials) => {
    const { data } = await http.post('/auth/login', credentials)
    sessionStorage.setItem('access_token', data.access_token)
    sessionStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }
  const logout = async () => {
    await http.post('/auth/logout', {}).catch(() => undefined)
    sessionStorage.clear()
    setUser(null)
  }
  const value = useMemo(() => ({ user, login, logout }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
