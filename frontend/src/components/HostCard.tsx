import { Link } from 'react-router-dom'
import { Server, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { HostSummary } from '../api/hosts'
import { formatDistanceToNow } from 'date-fns'

interface HostCardProps {
  host: HostSummary
}

export default function HostCard({ host }: HostCardProps) {
  const getStatusIcon = () => {
    switch (host.status) {
      case 'online':
        return <CheckCircle className="h-5 w-5 text-success" />
      case 'offline':
        return <XCircle className="h-5 w-5 text-unknown" />
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-danger" />
      default:
        return <Clock className="h-5 w-5 text-unknown" />
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
    <Link
      to={`/hosts/${host.id}`}
      className="block p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <Server className="h-6 w-6 text-gray-400" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {host.hostname}
            </h3>
            <p className="text-sm text-gray-500">
              {host.os_name} {host.os_version}
            </p>
            {host.fqdn && host.fqdn !== host.hostname && (
              <p className="text-xs text-gray-400">{host.fqdn}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`status-indicator ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Last Patch:</span>
          <p className="font-medium">
            {host.last_patch_time
              ? formatDistanceToNow(new Date(host.last_patch_time), { addSuffix: true })
              : 'Never'
            }
          </p>
        </div>
        
        <div>
          <span className="text-gray-500">Pending Updates:</span>
          <p className="font-medium">
            {host.pending_updates_count} total
            {host.pending_security_count > 0 && (
              <span className="text-danger ml-1">
                ({host.pending_security_count} security)
              </span>
            )}
          </p>
        </div>
        
        {host.needs_reboot && (
          <div className="col-span-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Reboot Required
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
