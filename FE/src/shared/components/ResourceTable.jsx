import {
  CAlert,
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
import { FiEdit2, FiTrash2 } from 'react-icons/fi'

function ResourceTable({ columns, items, loading, error, onEdit, onDelete, actions }) {
  return (
    <>
      {error && <CAlert color="danger">{error}</CAlert>}
      <CCard className="table-card">
        <CCardBody>
          {loading ? (
            <CSpinner />
          ) : (
            <CTable hover responsive align="middle">
              <CTableHead>
                <CTableRow>
                  {columns.map((column) => (
                    <CTableHeaderCell key={column.key}>{column.label}</CTableHeaderCell>
                  ))}
                  <CTableHeaderCell className="table-actions-heading">
                    {'Thao t\u00e1c'}
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {items.map((item) => (
                  <CTableRow key={item.id}>
                    {columns.map((column) => (
                      <CTableDataCell key={column.key}>
                        {column.render ? column.render(item) : item[column.key]}
                      </CTableDataCell>
                    ))}
                    <CTableDataCell className="table-actions-cell">
                      <div className="row-actions">
                        {actions?.(item)}
                        {onEdit && (
                          <button
                            type="button"
                            title={'Ch\u1ec9nh s\u1eeda'}
                            aria-label={'Ch\u1ec9nh s\u1eeda'}
                            onClick={() => onEdit(item)}
                          >
                            <FiEdit2 />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            className="danger"
                            title={'X\u00f3a'}
                            aria-label={'X\u00f3a'}
                            onClick={() => onDelete(item)}
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>
    </>
  )
}

export default ResourceTable
