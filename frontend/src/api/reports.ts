import apiClient from './client'

export interface ComplianceReport {
  total_hosts: number
  compliant_hosts: number
  compliance_percentage: number
  hosts_by_status: {
    compliant: number
    non_compliant: number
    unknown: number
  }
  critical_vulnerabilities: number
  high_vulnerabilities: number
  medium_vulnerabilities: number
  low_vulnerabilities: number
}

export interface VulnerabilityReport {
  total_cves: number
  critical_cves: number
  high_cves: number
  medium_cves: number
  low_cves: number
  affected_hosts: number
}

export const reportsApi = {
  getComplianceReport: async (): Promise<ComplianceReport> => {
    const response = await apiClient.get('/api/reports/compliance')
    return response.data
  },

  getVulnerabilityReport: async (): Promise<VulnerabilityReport> => {
    const response = await apiClient.get('/api/reports/vulnerabilities')
    return response.data
  },
}

