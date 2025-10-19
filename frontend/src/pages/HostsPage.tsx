import { useQuery } from 'react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Server, 
  RefreshCw,
  Search,
  Filter,
  Plus,
  ExternalLink
} from 'lucide-react'
import { hostsApi, HostSummary } from '../api/hosts'

const STATUS_COLORS = {
  online: 'bg-green-100 text-green-800',
  offline: 'bg-gray-100 text-gray-800',
  error: 'bg-red-100 text-red-800',
}

const STATUS_BADGES = {
  online: '🟢 Online',
  offline: '⚫ Offline',
  error: '🔴 Error',
}

export default function HostsPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [osFilter, setOsFilter] = useState('all')

  const { data: hosts, isLoading, refetch } = useQuery<HostSummary[]>(
    ['hosts', { search: searchTerm, status: statusFilter, os_name: osFilter }],
    () => hostsApi.getHosts({ 
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      os_name: osFilter !== 'all' ? osFilter : undefined,
    }),
    { refetchInterval: 30000 }
  )

  const filteredHosts = hosts?.filter(host => {
    if (searchTerm && !host.hostname.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  }) || []

  const handleRefresh = () => {
    refetch()
  }

  const handleHostClick = (hostId: string) => {
    navigate(`/hosts/${hostId}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading hosts...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hosts</h1>
          <p className="text-gray-600">Manage and monitor all your Linux hosts</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            className="btn btn-secondary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Host
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search hosts by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="error">Error</option>
            </select>
            <select
              value={osFilter}
              onChange={(e) => setOsFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">All OS</option>
              <option value="Ubuntu">Ubuntu</option>
              <option value="Debian">Debian</option>
              <option value="Red Hat">Red Hat</option>
              <option value="CentOS">CentOS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hosts Table */}
      <div className="card overflow-hidden">
        {filteredHosts.length === 0 ? (
          <div className="text-center py-12">
            <Server className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hosts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || osFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first host to monitor'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && osFilter === 'all' && (
              <div className="mt-6">
                <button className="btn btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Host
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hostname
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operating System
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending Updates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Security Patches
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Patched
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHosts.map((host) => (
                  <tr 
                    key={host.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleHostClick(host.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Server className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {host.hostname}
                          </div>
                          {host.fqdn && (
                            <div className="text-xs text-gray-500">{host.fqdn}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{host.os_name}</div>
                      <div className="text-xs text-gray-500">{host.os_version}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[host.status]}`}>
                        {STATUS_BADGES[host.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {host.pending_updates_count > 0 ? (
                          <span className="font-medium">{host.pending_updates_count}</span>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {host.pending_security_count > 0 ? (
                          <span className="font-medium text-red-600">
                            {host.pending_security_count}
                          </span>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {host.last_patch_time ? (
                        <div>
                          <div>{new Date(host.last_patch_time).toLocaleDateString()}</div>
                          {host.days_since_patch !== undefined && (
                            <div className={`text-xs ${host.days_since_patch > 30 ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                              {host.days_since_patch} days ago
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Unknown</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleHostClick(host.id)
                        }}
                        className="text-primary hover:text-primary-dark"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredHosts.length > 0 && (
        <div className="text-sm text-gray-500">
          Showing {filteredHosts.length} host{filteredHosts.length !== 1 ? 's' : ''}
          {(searchTerm || statusFilter !== 'all' || osFilter !== 'all') && ' (filtered)'}
        </div>
      )}
    </div>
  )
}

