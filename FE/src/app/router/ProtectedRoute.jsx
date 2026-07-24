import { Navigate } from 'react-router-dom'
import AppLayout from '../layout/AppLayout'
import useAuth from '../../modules/auth/useAuth'

export default function ProtectedRoute() {
  const { user } = useAuth()
  return user ? <AppLayout /> : <Navigate to="/login" replace />
}
