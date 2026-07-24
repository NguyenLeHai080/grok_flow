import { useState } from 'react'
import {
  CAlert,
  CButton,
  CForm,
  CFormInput,
  CFormSelect,
  CFormSwitch,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import { FiActivity } from 'react-icons/fi'
import ConfirmDialog from '../../shared/components/ConfirmDialog'
import PageHeader from '../../shared/components/PageHeader'
import ResourceTable from '../../shared/components/ResourceTable'
import StatusBadge from '../../shared/components/StatusBadge'
import useResource from '../../shared/hooks/useResource'
import http from '../../shared/api/http'

const empty = {
  name: '',
  base_url: 'http://localhost:8317',
  provider: 'cliproxyapi',
  config_json: '{}',
  is_active: true,
}
export default function ProxiesPage() {
  const resource = useResource('/proxies'),
    [visible, setVisible] = useState(false),
    [form, setForm] = useState(empty),
    [selected, setSelected] = useState(null),
    [deleting, setDeleting] = useState(null),
    [formError, setFormError] = useState(''),
    [saving, setSaving] = useState(false)
  const open = (item = null) => {
    setSelected(item)
    setForm(item || empty)
    setFormError('')
    setVisible(true)
  }
  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      JSON.parse(form.config_json || '{}')
      const payload = {
        ...form,
        name: form.name.trim(),
        base_url: form.base_url.trim().replace(/\/$/, ''),
        provider: form.provider.trim(),
        config_json: form.config_json || '{}',
      }
      selected
        ? await http.put(`/proxies/${selected.id}`, payload)
        : await http.post('/proxies', payload)
      setVisible(false)
      resource.load()
    } catch (error) {
      const detail = error.response?.data?.detail
      setFormError(
        Array.isArray(detail)
          ? detail.map((item) => item.msg).join('; ')
          : typeof detail === 'string'
            ? detail
            : error instanceof SyntaxError
              ? 'Config JSON khong hop le'
              : 'Khong the luu Proxy',
      )
    } finally {
      setSaving(false)
    }
  }
  const remove = async () => {
    await http.delete(`/proxies/${deleting.id}`)
    setDeleting(null)
    resource.load()
  }
  const health = async (item) => {
    const { data } = await http.post(`/proxies/${item.id}/health`)
    alert(data.healthy ? 'Kết nối thành công' : `Kết nối lỗi: ${data.error || data.status_code}`)
  }
  const columns = [
    { key: 'name', label: 'Tên' },
    { key: 'provider', label: 'Provider' },
    { key: 'base_url', label: 'Base URL' },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (item) => <StatusBadge value={item.is_active ? 'active' : 'revoked'} />,
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (item) => new Date(item.created_at).toLocaleString('vi-VN'),
    },
  ]
  return (
    <>
      <PageHeader
        title="ProxyAPI"
        description="Cấu hình và kiểm tra kết nối CLIProxyAPI qua OpenAI-compatible endpoint."
        action={() => open()}
        actionLabel="Thêm Proxy"
      />
      <ResourceTable
        {...resource}
        columns={columns}
        onEdit={open}
        onDelete={setDeleting}
        actions={(item) => (
          <button title="Kiểm tra" onClick={() => health(item)}>
            <FiActivity />
          </button>
        )}
      />
      <CModal visible={visible} onClose={() => setVisible(false)}>
        <CForm onSubmit={save}>
          <CModalHeader>
            <CModalTitle>{selected ? 'Sửa Proxy' : 'Thêm Proxy'}</CModalTitle>
          </CModalHeader>
          <CModalBody>
            {formError && <CAlert color="danger">{formError}</CAlert>}
            <CFormInput
              className="mb-3"
              label="Tên"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <CFormInput
              className="mb-3"
              label="Base URL"
              value={form.base_url}
              onChange={(e) => setForm({ ...form, base_url: e.target.value })}
              required
            />
            <CFormSelect
              className="mb-3"
              label="Provider"
              value={form.provider}
              onChange={(e) => {
                const provider = e.target.value
                setForm({
                  ...form,
                  provider,
                  base_url: provider === 'grok2api' ? 'http://grok2api:8000' : 'http://localhost:8317',
                })
              }}
              required
            >
              <option value="cliproxyapi">CLIProxyAPI</option>
              <option value="grok2api">Grok2API (Grok Web media)</option>
            </CFormSelect>
            <CFormTextarea
              className="mb-3 code-input"
              rows={5}
              label="Config JSON"
              value={form.config_json}
              onChange={(e) => setForm({ ...form, config_json: e.target.value })}
            />
            <CFormSwitch
              label="Đang hoạt động"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="ghost" onClick={() => setVisible(false)}>
              Huỷ
            </CButton>
            <CButton type="submit" disabled={saving}>
              {saving ? 'Dang luu...' : 'Luu'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
      <ConfirmDialog
        visible={!!deleting}
        message={`Xoá proxy ${deleting?.name}?`}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
      />
    </>
  )
}
