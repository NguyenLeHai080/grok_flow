import {
  CCard,
  CCardBody,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { FiCopy, FiEdit2, FiEye, FiImage, FiRefreshCw, FiTrash2 } from 'react-icons/fi'
import StatusBadge from '../../../shared/components/StatusBadge'

export default function JobsTable({
  loading,
  items,
  imageUrl,
  cacheBustedImageUrl,
  onReview,
  onRetry,
  onRunImage,
  onEdit,
  onDelete,
}) {
  const setReviewing = onReview
  const retry = onRetry
  const runImage = onRunImage
  const open = onEdit
  const setDeleting = onDelete
  return (
    <CCard className="table-card">
      <CCardBody>
        {loading ? (
          <CSpinner />
        ) : (
          <CTable hover responsive align="middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>ID</CTableHeaderCell>
                <CTableHeaderCell>Provider</CTableHeaderCell>
                <CTableHeaderCell>Type</CTableHeaderCell>
                <CTableHeaderCell>Prompt</CTableHeaderCell>
                <CTableHeaderCell>Result</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Created</CTableHeaderCell>
                <CTableHeaderCell>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {items.map((item) => {
                const resultImage = imageUrl(item)
                const previewImage = resultImage ? cacheBustedImageUrl(resultImage, item.id) : null
                return (
                  <CTableRow key={item.id}>
                    <CTableDataCell>#{item.id}</CTableDataCell>
                    <CTableDataCell>
                      <b>{item.provider}</b>
                    </CTableDataCell>
                    <CTableDataCell>{item.type}</CTableDataCell>
                    <CTableDataCell className="prompt-cell">{item.prompt}</CTableDataCell>
                    <CTableDataCell>
                      {previewImage ? (
                        <button
                          className="job-image-preview"
                          title="Mở ảnh"
                          onClick={() => window.open(previewImage, '_blank', 'noopener,noreferrer')}
                        >
                          <img src={previewImage} alt={item.prompt} />
                        </button>
                      ) : item.result ? (
                        <span className="text-body-secondary">Completed</span>
                      ) : (
                        '—'
                      )}
                    </CTableDataCell>
                    <CTableDataCell>
                      <StatusBadge value={item.status} />
                    </CTableDataCell>
                    <CTableDataCell>
                      {new Date(item.created_at).toLocaleString('vi-VN')}
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="row-actions">
                        <button
                          title="Sao chép prompt"
                          onClick={() => navigator.clipboard.writeText(item.prompt)}
                        >
                          <FiCopy />
                        </button>
                        <button title="Review result" onClick={() => setReviewing(item)}>
                          <FiEye />
                        </button>
                        <button title="Retry" onClick={() => retry(item.id)}>
                          <FiRefreshCw />
                        </button>
                        {item.type === 'image' && (
                          <button
                            title="Tạo lại ảnh Grok"
                            disabled={item.status === 'running'}
                            onClick={() => runImage(item.id)}
                          >
                            <FiImage />
                          </button>
                        )}
                        <button title="Sửa" onClick={() => open(item)}>
                          <FiEdit2 />
                        </button>
                        <button title="Xoá" className="danger" onClick={() => setDeleting(item)}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                )
              })}
            </CTableBody>
          </CTable>
        )}
      </CCardBody>
    </CCard>
  )
}
