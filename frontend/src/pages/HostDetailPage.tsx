import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { 
  ArrowLeft, 
  Server, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Download,
  Edit
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { hostsApi, HostDetail } from '../api/hosts'
import { formatDistanceToNow } from 'date-fns'

export default function HostDetailPage() {
  const { hostId } = useParams<{ hostId: string }>()
  
  const { data: host, isLoading, refetch } = useQuery<HostDetail>(
    ['host', hostId],
    () => hostsApi.getHost(hostId!),
    { enabled: !!hostId }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading host details...</span>
      </div>
    )
  }

  if (!host) {
    return (
      <div className="text-center py-12">
        <Server className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Host not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The host you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <div className="mt-6">
          <Link to="/dashboard" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const getStatusIcon = () => {
    switch (host.status) {
      case 'online':
        return <CheckCircle className="h-6 w-6 text-success" />
      case 'offline':
        return <Clock className="h-6 w-6 text-unknown" />
      case 'error':
        return <AlertTriangle className="h-6 w-6 text-danger" />
      default:
        return <Clock className="h-6 w-6 text-unknown" />
    }
  }

  const getStatusColor = () => {
    if (host.status !== 'online') return 'status-gray'
    
    if (host.pending_security_count > 0) return 'status-red'
    if (host.days_since_patch && host.days_since_patch > 30) return 'status-orange'
    if (host.pending_updates_count > 0) return 'status-yellow'
    return 'status-green'
  }

  const getStatusText = () => {
    if (host.status !== 'online') return host.status.toUpperCase()
    
    if (host.pending_security_count > 0) return 'SECURITY UPDATES'
    if (host.days_since_patch && host.days_since_patch > 30) return 'STALE'
    if (host.pending_updates_count > 0) return 'UPDATES PENDING'
    return 'HEALTHY'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{host.hostname}</h1>
            <p className="text-gray-600">{host.fqdn || host.ip_addresses?.[0]}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`status-indicator ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          
          <button
            onClick={() => refetch()}
            className="btn btn-secondary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          
          <button className="btn btn-secondary">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Operating System</dt>
                <dd className="mt-1 text-sm text-gray-900">{host.os_name} {host.os_version}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Architecture</dt>
                <dd className="mt-1 text-sm text-gray-900">{host.architecture || 'Unknown'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Agent Version</dt>
                <dd className="mt-1 text-sm text-gray-900">{host.agent_version || 'Unknown'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">IP Addresses</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {host.ip_addresses?.join(', ') || 'Unknown'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Patch Status</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Patched</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {host.last_patch_time
                    ? formatDistanceToNow(new Date(host.last_patch_time), { addSuffix: true })
                    : 'Never'
                  }
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Days Since Patch</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {host.days_since_patch || 'Unknown'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Pending Updates</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {host.pending_updates_count} total
                  {host.pending_security_count > 0 && (
                    <span className="text-danger ml-1">
                      ({host.pending_security_count} security)
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Reboot Required</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {host.needs_reboot ? (
                    <span className="text-orange-600 font-medium">Yes</span>
                  ) : (
                    <span className="text-green-600">No</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Pending Updates */}
          {host.pending_updates.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Updates</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Package
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Available
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {host.pending_updates.map((update) => (
                      <tr key={update.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {update.package_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {update.current_version || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {update.available_version || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`status-indicator ${
                            update.is_security ? 'status-red' : 'status-yellow'
                          }`}>
                            {update.is_security ? 'Security' : 'Regular'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full btn btn-primary">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </button>
              <button className="w-full btn btn-secondary">
                <Edit className="h-4 w-4 mr-2" />
                Add Note
              </button>
              <button className="w-full btn btn-secondary">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {host.snapshots.slice(0, 5).map((snapshot) => (
                <div key={snapshot.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Clock className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {snapshot.pending_updates_count} updates available
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(snapshot.collected_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
