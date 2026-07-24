import { useState } from 'react'
import {
  CButton,
  CForm,
  CFormInput,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import ConfirmDialog from '../../shared/components/ConfirmDialog'
import PageHeader from '../../shared/components/PageHeader'
import ResourceTable from '../../shared/components/ResourceTable'
import StatusBadge from '../../shared/components/StatusBadge'
import useResource from '../../shared/hooks/useResource'
import http from '../../shared/api/http'

const empty = { email: '', full_name: '', password: '', role: 'viewer', is_active: true }
export default function SettingsPage() {
  const resource = useResource('/users'),
    [form, setForm] = useState(empty),
    [selected, setSelected] = useState(null),
    [visible, setVisible] = useState(false),
    [deleting, setDeleting] = useState(null)
  const open = (item = null) => {
    setSelected(item)
    setForm(item ? { ...item, password: '' } : empty)
    setVisible(true)
  }
  const save = async (e) => {
    e.preventDefault()
    const data = { ...form }
    if (selected) {
      delete data.email
      if (!data.password) delete data.password
      await http.put(`/users/${selected.id}`, data)
    } else await http.post('/users', data)
    setVisible(false)
    resource.load()
  }
  const remove = async () => {
    await http.delete(`/users/${deleting.id}`)
    setDeleting(null)
    resource.load()
  }
  const columns = [
    { key: 'full_name', label: 'Họ tên' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    {
      key: 'status',
      label: 'Status',
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
        title="Settings"
        description="Quản lý tài khoản, vai trò và trạng thái truy cập hệ thống."
        action={() => open()}
        actionLabel="Thêm tài khoản"
      />
      <ResourceTable {...resource} columns={columns} onEdit={open} onDelete={setDeleting} />
      <CModal visible={visible} onClose={() => setVisible(false)}>
        <CForm onSubmit={save}>
          <CModalHeader>
            <CModalTitle>{selected ? 'Sửa tài khoản' : 'Thêm tài khoản'}</CModalTitle>
          </CModalHeader>
          <CModalBody>
            {!selected && (
              <CFormInput
                className="mb-3"
                type="email"
                label="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            )}
            <CFormInput
              className="mb-3"
              label="Họ tên"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
            <CFormInput
              className="mb-3"
              type="password"
              label={
                selected
                  ? 'Mật khẩu mới (để trống nếu giữ nguyên)'
                  : 'Mật khẩu (tối thiểu 12 ký tự)'
              }
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!selected}
            />
            <CFormSelect
              label="Vai trò"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {['admin', 'operator', 'viewer'].map((role) => (
                <option key={role}>{role}</option>
              ))}
            </CFormSelect>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="ghost" onClick={() => setVisible(false)}>
              Huỷ
            </CButton>
            <CButton type="submit">Lưu</CButton>
          </CModalFooter>
        </CForm>
      </CModal>
      <ConfirmDialog
        visible={!!deleting}
        message={`Xoá tài khoản ${deleting?.email}?`}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
      />
    </>
  )
}
