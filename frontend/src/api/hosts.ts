import apiClient from './client'

export interface HostSummary {
  id: string
  hostname: string
  fqdn?: string
  ip_addresses?: string[]
  os_name: string
  os_version: string
  status: 'online' | 'offline' | 'error'
  last_patch_time?: string
  pending_updates_count: number
  pending_security_count: number
  needs_reboot: boolean
  days_since_patch?: number
}

export interface HostDetail extends HostSummary {
  architecture?: string
  agent_version?: string
  created_at: string
  updated_at?: string
  snapshots: HostSnapshot[]
  pending_updates: PendingUpdate[]
  alerts: Alert[]
  tags: Tag[]
}

export interface HostSnapshot {
  id: string
  host_id: string
  collected_at: string
  kernel_version?: string
  last_boot_time?: string
  last_patch_time?: string
  pending_updates_count: number
  pending_security_count: number
  needs_reboot: boolean
}

export interface PendingUpdate {
  id: string
  host_snapshot_id: string
  package_name: string
  current_version?: string
  available_version?: string
  is_security: boolean
  update_type: 'critical' | 'important' | 'moderate' | 'low'
  cves: CVE[]
}

export interface CVE {
  id: string
  cve_id: string
  description?: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  cvss_score?: number
  published_date?: string
  url?: string
}

export interface Alert {
  id: string
  host_id: string
  alert_type: 'patch_lag' | 'critical_cve' | 'offline' | 'reboot_needed'
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  triggered_at: string
  acknowledged: boolean
  acknowledged_by?: string
  acknowledged_at?: string
}

export interface Tag {
  id: string
  name: string
  color?: string
}

export interface DashboardMetrics {
  total_hosts: number
  hosts_by_status: Record<string, number>
  average_patch_lag_days: number
  total_pending_security_patches: number
  hosts_requiring_reboot: number
  recently_updated_hosts: number
}

export const hostsApi = {
  getHosts: async (params?: {
    skip?: number
    limit?: number
    status?: string
    os_name?: string
    search?: string
  }): Promise<HostSummary[]> => {
    const response = await apiClient.get('/api/hosts', { params })
    return response.data
  },

  getHost: async (hostId: string): Promise<HostDetail> => {
    const response = await apiClient.get(`/api/hosts/${hostId}`)
    return response.data
  },

  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    const response = await apiClient.get('/api/hosts/dashboard/metrics')
    return response.data
  },

  createHost: async (hostData: Partial<HostSummary>): Promise<HostSummary> => {
    const response = await apiClient.post('/api/hosts', hostData)
    return response.data
  },

  updateHost: async (hostId: string, hostData: Partial<HostSummary>): Promise<HostSummary> => {
    const response = await apiClient.put(`/api/hosts/${hostId}`, hostData)
    return response.data
  },

  deleteHost: async (hostId: string): Promise<void> => {
    await apiClient.delete(`/api/hosts/${hostId}`)
  },
}
