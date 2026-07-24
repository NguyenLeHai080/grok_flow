import { FiCheck } from 'react-icons/fi'
import PageHeader from '../../shared/components/PageHeader'
import ResourceTable from '../../shared/components/ResourceTable'
import StatusBadge from '../../shared/components/StatusBadge'
import useResource from '../../shared/hooks/useResource'
import http from '../../shared/api/http'

export default function LogsPage() {
  const resource = useResource('/logs')
  const resolve = async (item) => {
    await http.post(`/logs/${item.id}/resolve`)
    resource.load()
  }
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'level', label: 'Level' },
    { key: 'source', label: 'Source' },
    { key: 'message', label: 'Message' },
    {
      key: 'status',
      label: 'Status',
      render: (item) => <StatusBadge value={item.resolved ? 'resolved' : 'open'} />,
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
        title="Logs lỗi"
        description="Theo dõi exception backend và đánh dấu sự cố đã xử lý."
      />
      <ResourceTable
        {...resource}
        columns={columns}
        actions={(item) =>
          !item.resolved && (
            <button title="Đã xử lý" onClick={() => resolve(item)}>
              <FiCheck />
            </button>
          )
        }
      />
    </>
  )
}
