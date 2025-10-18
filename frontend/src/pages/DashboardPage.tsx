import { useQuery } from 'react-query'
import { useState } from 'react'
import { 
  Server, 
  Shield, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  Search,
  Filter
} from 'lucide-react'
import { hostsApi, HostSummary, DashboardMetrics } from '../api/hosts'
import HostCard from '../components/HostCard'
import MetricsCard from '../components/MetricsCard'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const COLORS = {
  green: '#10B981',
  yellow: '#F59E0B',
  orange: '#F97316',
  red: '#EF4444',
  gray: '#6B7280',
}

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [osFilter, setOsFilter] = useState('all')

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>(
    'dashboard-metrics',
    hostsApi.getDashboardMetrics,
    { refetchInterval: 30000 } // Refresh every 30 seconds
  )

  const { data: hosts, isLoading: hostsLoading, refetch } = useQuery<HostSummary[]>(
    ['hosts', { search: searchTerm, status: statusFilter, os_name: osFilter }],
    () => hostsApi.getHosts({ 
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      os_name: osFilter !== 'all' ? osFilter : undefined,
    }),
    { refetchInterval: 30000 } // Refresh every 30 seconds
  )

  const filteredHosts = hosts?.filter(host => {
    if (searchTerm && !host.hostname.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  }) || []

  const statusData = metrics ? Object.entries(metrics.hosts_by_status).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: status === 'online' ? COLORS.green : 
           status === 'offline' ? COLORS.gray : COLORS.red
  })) : []

  const handleRefresh = () => {
    refetch()
  }

  if (metricsLoading || hostsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your Linux hosts patch status</p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn btn-secondary"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Total Hosts"
            value={metrics.total_hosts}
            icon={Server}
            color="blue"
          />
          <MetricsCard
            title="Healthy Hosts"
            value={metrics.hosts_by_status.online || 0}
            icon={Shield}
            color="green"
            subtitle={`${Math.round(((metrics.hosts_by_status.online || 0) / metrics.total_hosts) * 100)}% of total`}
          />
          <MetricsCard
            title="Security Patches"
            value={metrics.total_pending_security_patches}
            icon={AlertTriangle}
            color="red"
            subtitle="Pending security updates"
          />
          <MetricsCard
            title="Reboot Required"
            value={metrics.hosts_requiring_reboot}
            icon={Clock}
            color="orange"
            subtitle="Hosts needing reboot"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Host Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Patch Lag Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: '0-7 days', value: 150, color: COLORS.green },
                { name: '8-30 days', value: 45, color: COLORS.yellow },
                { name: '31-60 days', value: 20, color: COLORS.orange },
                { name: '60+ days', value: 5, color: COLORS.red },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Hosts Section */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Hosts</h3>
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search hosts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
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

        {filteredHosts.length === 0 ? (
          <div className="text-center py-12">
            <Server className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hosts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || osFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding some hosts to monitor'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHosts.map((host) => (
              <HostCard key={host.id} host={host} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
