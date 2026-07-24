import { useState } from 'react'
import {
  CAlert,
  CButton,
  CForm,
  CFormInput,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import { FiSlash } from 'react-icons/fi'
import ConfirmDialog from '../../shared/components/ConfirmDialog'
import PageHeader from '../../shared/components/PageHeader'
import ResourceTable from '../../shared/components/ResourceTable'
import StatusBadge from '../../shared/components/StatusBadge'
import useResource from '../../shared/hooks/useResource'
import http from '../../shared/api/http'

export default function ApiKeysPage() {
  const resource = useResource('/api-keys'),
    [name, setName] = useState(''),
    [selected, setSelected] = useState(null),
    [visible, setVisible] = useState(false),
    [created, setCreated] = useState(''),
    [deleting, setDeleting] = useState(null)
  const open = (item = null) => {
    setSelected(item)
    setName(item?.name || '')
    setVisible(true)
  }
  const save = async (e) => {
    e.preventDefault()
    const { data } = selected
      ? await http.put(`/api-keys/${selected.id}`, { name })
      : await http.post('/api-keys', { name })
    if (data.key) setCreated(data.key)
    setVisible(false)
    resource.load()
  }
  const revoke = async (item) => {
    await http.post(`/api-keys/${item.id}/revoke`)
    resource.load()
  }
  const remove = async () => {
    await http.delete(`/api-keys/${deleting.id}`)
    setDeleting(null)
    resource.load()
  }
  const columns = [
    { key: 'name', label: 'Tên' },
    { key: 'prefix', label: 'Prefix' },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (item) => <StatusBadge value={item.revoked_at ? 'revoked' : 'active'} />,
    },
    {
      key: 'last_used_at',
      label: 'Last used',
      render: (item) =>
        item.last_used_at ? new Date(item.last_used_at).toLocaleString('vi-VN') : 'Chưa dùng',
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
        title="API Keys"
        description="Tạo key uxpm_live, đổi tên, thu hồi và xoá key truy cập."
        action={() => open()}
        actionLabel="Tạo API Key"
      />
      {created && (
        <CAlert color="warning" dismissible onClose={() => setCreated('')}>
          <b>Chỉ hiển thị một lần:</b> <code>{created}</code>{' '}
          <button className="copy-link" onClick={() => navigator.clipboard.writeText(created)}>
            Sao chép
          </button>
        </CAlert>
      )}
      <ResourceTable
        {...resource}
        columns={columns}
        onEdit={open}
        onDelete={setDeleting}
        actions={(item) =>
          !item.revoked_at && (
            <button title="Thu hồi" onClick={() => revoke(item)}>
              <FiSlash />
            </button>
          )
        }
      />
      <CModal visible={visible} onClose={() => setVisible(false)}>
        <CForm onSubmit={save}>
          <CModalHeader>
            <CModalTitle>{selected ? 'Đổi tên key' : 'Tạo API Key'}</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CFormInput
              label="Tên key"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
        message={`Xoá key ${deleting?.name}?`}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
      />
    </>
  )
}
