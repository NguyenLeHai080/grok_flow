import { useCallback, useEffect, useMemo, useState } from 'react'
import { CAlert, CBadge, CButton, CCard, CCardBody, CSpinner } from '@coreui/react'
import {
  FiActivity,
  FiBarChart2,
  FiDatabase,
  FiFilm,
  FiGlobe,
  FiImage,
  FiKey,
  FiRefreshCw,
  FiSettings,
  FiZap,
} from 'react-icons/fi'
import http from '../../shared/api/http'
import Grok2ApiCreateModal from './components/Grok2ApiCreateModal'
import {
  Dashboard,
  DataTable,
  EgressPanel,
  JsonPanel,
  QuotaPanel,
} from './components/Grok2ApiPanels'
import './grok2api.scss'

const sections = [
  {
    id: 'dashboard',
    label: 'Tổng quan',
    icon: FiBarChart2,
    endpoint: 'dashboard?period=7d&timezone=Asia/Bangkok',
  },
  { id: 'accounts', label: 'Accounts', icon: FiDatabase, endpoint: 'accounts?page=1&pageSize=500' },
  { id: 'quota', label: 'Quota', icon: FiActivity, endpoint: 'accounts?page=1&pageSize=500' },
  { id: 'models', label: 'Models', icon: FiZap, endpoint: 'models?page=1&pageSize=500' },
  {
    id: 'client-keys',
    label: 'Client Keys',
    icon: FiKey,
    endpoint: 'client-keys?page=1&pageSize=500',
  },
  { id: 'media', label: 'Images', icon: FiImage, endpoint: 'media/images?page=1&pageSize=100' },
  { id: 'videos', label: 'Videos', icon: FiFilm, endpoint: 'media/videos?page=1&pageSize=100' },
  { id: 'audits', label: 'Audit', icon: FiActivity, endpoint: 'request-audits?pageSize=100' },
  { id: 'egress', label: 'Egress', icon: FiGlobe, endpoint: 'egress-nodes' },
  { id: 'settings', label: 'Settings', icon: FiSettings, endpoint: 'settings' },
]

const unwrap = (value) => value?.data || value || {}
const rowsOf = (value) => {
  const data = unwrap(value)
  return Array.isArray(data) ? data : data.items || []
}

export default function Grok2ApiPage({ section = 'dashboard' }) {
  const [status, setStatus] = useState(null)
  const [payload, setPayload] = useState({})
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [message, setMessage] = useState(null)
  const [createVisible, setCreateVisible] = useState(false)
  const [createdSecret, setCreatedSecret] = useState('')
  const [oauthSession, setOauthSession] = useState(null)
  const [form, setForm] = useState({
    name: '',
    publicId: '',
    provider: 'build',
    upstreamModel: '',
    capability: 'chat',
    rpmLimit: 0,
    maxConcurrent: 0,
  })
  const active = useMemo(
    () => sections.find((item) => item.id === section) || sections[0],
    [section],
  )
  const rows = rowsOf(payload)

  const load = useCallback(
    async (target = active) => {
      setLoading(true)
      setMessage(null)
      try {
        const [statusResponse, dataResponse] = await Promise.all([
          http.get('/grok2api/status'),
          http.get(`/grok2api/admin/${target.endpoint}`),
        ])
        setStatus(statusResponse.data)
        setPayload(dataResponse.data)
      } catch (error) {
        setMessage({
          color: 'danger',
          text: error.response?.data?.detail || 'Khong tai duoc du lieu Grok2API',
        })
      } finally {
        setLoading(false)
      }
    },
    [active],
  )

  useEffect(() => {
    let mounted = true
    const target = active
    Promise.all([http.get('/grok2api/status'), http.get(`/grok2api/admin/${target.endpoint}`)])
      .then(([statusResponse, dataResponse]) => {
        if (!mounted) return
        setStatus(statusResponse.data)
        setPayload(dataResponse.data)
      })
      .catch((error) => {
        if (mounted)
          setMessage({
            color: 'danger',
            text: error.response?.data?.detail || 'Không tải được dữ liệu Grok2API',
          })
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [active])

  useEffect(() => {
    if (!oauthSession) return undefined
    const timer = window.setInterval(
      async () => {
        try {
          const { data } = await http.post(
            `/grok2api/admin/accounts/device/${oauthSession.sessionId}/poll`,
            {},
          )
          const result = unwrap(data)
          if (result.status && result.status !== 'pending') {
            window.clearInterval(timer)
            setOauthSession(null)
            setMessage({
              color: result.status === 'succeeded' ? 'success' : 'warning',
              text:
                result.status === 'succeeded'
                  ? 'Da them account Grok2API.'
                  : 'Account da them nhung dong bo model co loi.',
            })
            await load(sections.find((item) => item.id === 'accounts'))
          }
        } catch (error) {
          if (error.response?.status === 410) {
            window.clearInterval(timer)
            setOauthSession(null)
            setMessage({ color: 'danger', text: 'Device OAuth da het han hoac bi tu choi.' })
          }
        }
      },
      Math.max((oauthSession.intervalSeconds || 5) * 1000, 5000),
    )
    return () => window.clearInterval(timer)
  }, [load, oauthSession])

  const execute = async (name, method, endpoint, body) => {
    setAction(name)
    setMessage(null)
    try {
      await http({ method, url: `/grok2api/admin/${endpoint}`, data: body })
      setMessage({ color: 'success', text: 'Thao tac Grok2API thanh cong.' })
      await load(active)
    } catch (error) {
      setMessage({
        color: 'danger',
        text: error.response?.data?.detail || 'Thao tac Grok2API that bai',
      })
    } finally {
      setAction('')
    }
  }

  const toggle = (item) => {
    const enabled = item.enabled !== false && !item.disabled
    return execute(`toggle-${item.id}`, 'patch', `${section}/${item.id}`, { enabled: !enabled })
  }

  const remove = (item) => {
    if (!window.confirm(`Xoa ${item.name || item.publicId || item.id}?`)) return
    return execute(`delete-${item.id}`, 'delete', `${section}/${item.id}`)
  }

  const openCreate = async () => {
    if (section === 'accounts') {
      setAction('create-account')
      try {
        const { data } = await http.post('/grok2api/admin/accounts/device/start', {})
        const result = unwrap(data)
        if (result.verificationUriComplete || result.verificationUri)
          window.open(
            result.verificationUriComplete || result.verificationUri,
            '_blank',
            'noopener,noreferrer',
          )
        setOauthSession(result)
        setMessage({
          color: 'info',
          text: `Mo trang xAI va nhap ma ${result.userCode}. Sau khi xac nhan, bam Refresh accounts.`,
        })
      } catch (error) {
        setMessage({
          color: 'danger',
          text: error.response?.data?.detail || 'Khong khoi tao duoc Device OAuth',
        })
      } finally {
        setAction('')
      }
      return
    }
    setForm({
      name: '',
      publicId: '',
      provider: 'build',
      upstreamModel: '',
      capability: 'chat',
      rpmLimit: 0,
      maxConcurrent: 0,
    })
    setCreateVisible(true)
  }

  const createResource = async (event) => {
    event.preventDefault()
    setAction('create')
    try {
      const body =
        section === 'models'
          ? {
              publicId: form.publicId,
              provider: form.provider,
              upstreamModel: form.upstreamModel,
              capability: form.capability,
              enabled: true,
              accountIds: [],
            }
          : {
              name: form.name,
              enabled: true,
              rpmLimit: Number(form.rpmLimit),
              maxConcurrent: Number(form.maxConcurrent),
              billingLimitUsdTicks: 0,
              allowedModelIds: [],
            }
      const { data } = await http.post(`/grok2api/admin/${section}`, body)
      const result = unwrap(data)
      if (result.secret) setCreatedSecret(result.secret)
      setCreateVisible(false)
      setMessage({
        color: 'success',
        text: section === 'models' ? 'Da them model.' : 'Da tao client key.',
      })
      await load(active)
    } catch (error) {
      setMessage({
        color: 'danger',
        text: error.response?.data?.detail || 'Khong tao duoc tai nguyen',
      })
    } finally {
      setAction('')
    }
  }

  const toolbar = () => {
    if (section === 'models')
      return (
        <div className="d-flex gap-2">
          <CButton color="success" disabled={!!action} onClick={openCreate}>
            Them model
          </CButton>
          <CButton disabled={!!action} onClick={() => execute('sync', 'post', 'models/sync', {})}>
            <FiRefreshCw /> Dong bo models
          </CButton>
        </div>
      )
    if (section === 'accounts')
      return (
        <div className="d-flex gap-2">
          <CButton color="success" disabled={!!action} onClick={openCreate}>
            Them account
          </CButton>
          <CButton
            disabled={!!action}
            onClick={() => execute('refresh', 'post', 'accounts/refresh-tokens', {})}
          >
            <FiRefreshCw /> Refresh accounts
          </CButton>
        </div>
      )
    if (section === 'quota')
      return (
        <div className="d-flex gap-2">
          <CButton
            disabled={!!action}
            onClick={() => execute('quota-web', 'post', 'accounts/web/refresh-quotas', {})}
          >
            Refresh Web
          </CButton>
          <CButton
            disabled={!!action}
            onClick={() => execute('quota-console', 'post', 'accounts/console/refresh-quotas', {})}
          >
            Refresh Console
          </CButton>
          <CButton
            color="secondary"
            disabled={!!action}
            onClick={() => execute('billing', 'post', 'accounts/refresh-billing', {})}
          >
            Refresh Billing
          </CButton>
        </div>
      )
    if (section === 'egress')
      return (
        <CButton
          disabled={!!action}
          onClick={() =>
            execute('test-egress', 'post', 'egress-nodes/test', {
              ids: rows.map((item) => item.id),
            })
          }
        >
          Kiểm tra tất cả node
        </CButton>
      )
    if (section === 'client-keys')
      return (
        <CButton color="success" disabled={!!action} onClick={openCreate}>
          Them client key
        </CButton>
      )
    return (
      <CButton color="secondary" disabled={loading} onClick={() => load(active)}>
        <FiRefreshCw /> Tai lai
      </CButton>
    )
  }

  return (
    <div className="g2a-console">
      <section className="g2a-hero">
        <div className="g2a-hero-copy">
          <span className="g2a-eyebrow">AI Infrastructure</span>
          <h1>Internal Grok2API</h1>
          <p>
            Quản trị tài khoản, model, API key và tài nguyên media ngay trong Groks — bảo mật trên
            cùng một domain.
          </p>
        </div>
        <div className={`g2a-runtime ${status?.ready ? 'is-ready' : ''}`}>
          <span className="g2a-runtime-dot" />
          <div>
            <small>Runtime status</small>
            <strong>
              {status?.ready ? 'Operational' : status?.running ? 'Starting' : 'Offline'}
            </strong>
          </div>
        </div>
      </section>
      {message && <CAlert color={message.color}>{message.text}</CAlert>}
      {createdSecret && (
        <CAlert color="warning" dismissible onClose={() => setCreatedSecret('')}>
          <b>Secret chi hien thi mot lan:</b> <code>{createdSecret}</code>{' '}
          <button
            className="copy-link"
            onClick={() => navigator.clipboard.writeText(createdSecret)}
          >
            Sao chep
          </button>
        </CAlert>
      )}
      <div className="g2a-metrics">
        <div>
          <span>Internal endpoint</span>
          <strong>{status?.base_url || 'Chưa kết nối'}</strong>
        </div>
        <div>
          <span>Client API key</span>
          <strong className={status?.api_key_configured ? 'text-success' : 'text-danger'}>
            {status?.api_key_configured ? 'Đã cấu hình' : 'Chưa cấu hình'}
          </strong>
        </div>
        <div>
          <span>Admin bridge</span>
          <strong className={status?.admin_configured ? 'text-success' : 'text-danger'}>
            {status?.admin_configured ? 'Đã bảo vệ' : 'Chưa cấu hình'}
          </strong>
        </div>
      </div>
      <CCard className="g2a-workspace">
        <CCardBody>
          <div className="g2a-page-toolbar">
            <div className="g2a-section-heading">
              <div>
                <span>Grok2API resource</span>
                <h2>{active.label}</h2>
              </div>
              {section !== 'dashboard' && section !== 'settings' && (
                <CBadge color="light" textColor="dark">
                  {rows.length} bản ghi
                </CBadge>
              )}
            </div>
            <div className="g2a-toolbar-actions">{toolbar()}</div>
          </div>
          {loading ? (
            <div className="gateway-loader">
              <CSpinner />
            </div>
          ) : section === 'dashboard' ? (
            <Dashboard data={unwrap(payload)} />
          ) : section === 'quota' ? (
            <QuotaPanel rows={rows} />
          ) : section === 'egress' ? (
            <EgressPanel
              rows={rows}
              action={action}
              onTest={(item) =>
                execute(`test-${item.id}`, 'post', `egress-nodes/${item.id}/test`, {})
              }
              onToggle={(item) =>
                execute(`toggle-${item.id}`, 'put', `egress-nodes/${item.id}`, {
                  enabled: !item.enabled,
                })
              }
              onDelete={(item) => {
                if (window.confirm(`Xóa ${item.name}?`))
                  execute(`delete-${item.id}`, 'delete', `egress-nodes/${item.id}`)
              }}
            />
          ) : section === 'settings' ? (
            <JsonPanel data={unwrap(payload)} />
          ) : (
            <DataTable
              section={section}
              rows={rows}
              action={action}
              onToggle={toggle}
              onDelete={remove}
            />
          )}
        </CCardBody>
      </CCard>
      <Grok2ApiCreateModal
        section={section}
        visible={createVisible}
        action={action}
        form={form}
        setForm={setForm}
        onClose={() => setCreateVisible(false)}
        onSubmit={createResource}
      />
    </div>
  )
}
