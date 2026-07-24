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
  CSpinner,
} from '@coreui/react'

export default function Grok2ApiCreateModal({
  section,
  visible,
  action,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  const createVisible = visible
  const setCreateVisible = (value) => {
    if (!value) onClose()
  }
  const createResource = onSubmit
  return (
    <CModal className="g2a-modal" visible={createVisible} onClose={() => setCreateVisible(false)}>
      <CForm onSubmit={createResource}>
        <CModalHeader>
          <CModalTitle>
            {section === 'models' ? 'Them model Grok2API' : 'Tao Grok2API client key'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {section === 'models' ? (
            <>
              <CFormInput
                className="mb-3"
                label="Public model ID"
                value={form.publicId}
                onChange={(event) => setForm({ ...form, publicId: event.target.value })}
                required
              />
              <CFormInput
                className="mb-3"
                label="Upstream model"
                value={form.upstreamModel}
                onChange={(event) => setForm({ ...form, upstreamModel: event.target.value })}
                required
              />
              <CFormSelect
                className="mb-3"
                label="Provider"
                value={form.provider}
                onChange={(event) => setForm({ ...form, provider: event.target.value })}
              >
                <option value="build">Build</option>
                <option value="web">Web</option>
                <option value="console">Console</option>
              </CFormSelect>
              <CFormSelect
                label="Capability"
                value={form.capability}
                onChange={(event) => setForm({ ...form, capability: event.target.value })}
              >
                <option value="chat">Chat</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </CFormSelect>
            </>
          ) : (
            <>
              <CFormInput
                className="mb-3"
                label="Ten key"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
              <CFormInput
                className="mb-3"
                type="number"
                min="0"
                label="RPM limit (0 = unlimited)"
                value={form.rpmLimit}
                onChange={(event) => setForm({ ...form, rpmLimit: event.target.value })}
              />
              <CFormInput
                type="number"
                min="0"
                label="Max concurrent (0 = unlimited)"
                value={form.maxConcurrent}
                onChange={(event) => setForm({ ...form, maxConcurrent: event.target.value })}
              />
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={() => setCreateVisible(false)}>
            Huy
          </CButton>
          <CButton type="submit" disabled={action === 'create'}>
            {action === 'create' ? <CSpinner size="sm" /> : 'Tao moi'}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}
