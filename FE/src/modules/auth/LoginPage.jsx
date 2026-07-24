import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { CAlert, CButton, CCard, CCardBody, CForm, CFormInput } from '@coreui/react'
import { FiLock, FiZap } from 'react-icons/fi'
import useAuth from './useAuth'
import './login.scss'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: 'admin@groks.dev', password: 'ChangeMe123!' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  if (user) return <Navigate to="/" replace />
  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form)
      navigate('/')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Không thể đăng nhập')
    } finally {
      setLoading(false)
    }
  }
  return (
    <main className="login-page">
      <section className="login-brand">
        <FiZap />
        <h1>Groks</h1>
        <p>AI gateway operations, jobs and access management.</p>
      </section>
      <CCard className="login-card">
        <CCardBody>
          <div className="login-icon">
            <FiLock />
          </div>
          <h2>Welcome back</h2>
          <p className="text-body-secondary">Đăng nhập vào control center</p>
          {error && <CAlert color="danger">{error}</CAlert>}
          <CForm onSubmit={submit}>
            <CFormInput
              className="mb-3"
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <CFormInput
              className="mb-4"
              label="Mật khẩu"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <CButton type="submit" color="primary" className="w-100" disabled={loading}>
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </CButton>
          </CForm>
        </CCardBody>
      </CCard>
    </main>
  )
}
