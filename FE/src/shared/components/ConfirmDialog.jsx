import { CButton, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react'

export default function ConfirmDialog({
  visible,
  title = 'X\u00e1c nh\u1eadn',
  message,
  onClose,
  onConfirm,
}) {
  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <CModalTitle>{title}</CModalTitle>
      </CModalHeader>
      <CModalBody>{message}</CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="ghost" onClick={onClose}>
          {'H\u1ee7y'}
        </CButton>
        <CButton color="danger" onClick={onConfirm}>
          {'X\u00e1c nh\u1eadn'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
