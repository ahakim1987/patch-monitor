import { useQuery } from 'react-query'
import { FileText, Download, RefreshCw } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

// Mock API for reports - replace with actual API calls
const mockComplianceReport = {
  total_hosts: 245,
  compliant_hosts: 198,
  compliance_percentage: 80.8,
  hosts_by_status: {
    compliant: 198,
    non_compliant: 32,
    unknown: 15
  },
  critical_vulnerabilities: 12,
  high_vulnerabilities: 45,
  medium_vulnerabilities: 78,
  low_vulnerabilities: 23
}

const mockVulnerabilityReport = {
  total_cves: 158,
  critical_cves: 12,
  high_cves: 45,
  medium_cves: 78,
  low_cves: 23,
  affected_hosts: 67
}

export default function ReportsPage() {
  const { data: complianceReport, isLoading: complianceLoading } = useQuery(
    'compliance-report',
    () => Promise.resolve(mockComplianceReport),
    { refetchInterval: 300000 } // 5 minutes
  )

  const { data: vulnerabilityReport, isLoading: vulnerabilityLoading } = useQuery(
    'vulnerability-report',
    () => Promise.resolve(mockVulnerabilityReport),
    { refetchInterval: 300000 } // 5 minutes
  )

  const complianceData = complianceReport ? [
    { name: 'Compliant', value: complianceReport.compliant_hosts, color: '#10B981' },
    { name: 'Non-Compliant', value: complianceReport.non_compliant, color: '#EF4444' },
    { name: 'Unknown', value: complianceReport.hosts_by_status.unknown, color: '#6B7280' }
  ] : []

  const vulnerabilityData = vulnerabilityReport ? [
    { name: 'Critical', value: vulnerabilityReport.critical_cves, color: '#EF4444' },
    { name: 'High', value: vulnerabilityReport.high_cves, color: '#F97316' },
    { name: 'Medium', value: vulnerabilityReport.medium_cves, color: '#F59E0B' },
    { name: 'Low', value: vulnerabilityReport.low_cves, color: '#10B981' }
  ] : []

  const handleExport = (format: 'pdf' | 'csv' | 'json') => {
    // Implement export functionality
    console.log(`Exporting report as ${format}`)
  }

  if (complianceLoading || vulnerabilityLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading reports...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Compliance and vulnerability reports</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleExport('pdf')}
            className="btn btn-secondary"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="btn btn-secondary"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Compliance Report */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Patch Compliance Report</h2>
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </span>
          </div>
        </div>

        {complianceReport && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {complianceReport.compliance_percentage}%
                  </div>
                  <div className="text-sm text-gray-500">Overall Compliance</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {complianceReport.total_hosts}
                  </div>
                  <div className="text-sm text-gray-500">Total Hosts</div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={complianceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {complianceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Vulnerability Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Critical:</span>
                    <span className="text-sm font-medium text-red-600">
                      {complianceReport.critical_vulnerabilities}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">High:</span>
                    <span className="text-sm font-medium text-orange-600">
                      {complianceReport.high_vulnerabilities}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Medium:</span>
                    <span className="text-sm font-medium text-yellow-600">
                      {complianceReport.medium_vulnerabilities}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Low:</span>
                    <span className="text-sm font-medium text-green-600">
                      {complianceReport.low_vulnerabilities}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vulnerability Report */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Vulnerability Report</h2>
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </span>
          </div>
        </div>

        {vulnerabilityReport && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {vulnerabilityReport.total_cves}
                  </div>
                  <div className="text-sm text-gray-500">Total CVEs</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {vulnerabilityReport.affected_hosts}
                  </div>
                  <div className="text-sm text-gray-500">Affected Hosts</div>
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vulnerabilityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Severity Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Critical:</span>
                    <span className="text-sm font-medium text-red-600">
                      {vulnerabilityReport.critical_cves}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">High:</span>
                    <span className="text-sm font-medium text-orange-600">
                      {vulnerabilityReport.high_cves}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Medium:</span>
                    <span className="text-sm font-medium text-yellow-600">
                      {vulnerabilityReport.medium_cves}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Low:</span>
                    <span className="text-sm font-medium text-green-600">
                      {vulnerabilityReport.low_cves}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium text-gray-900">Stale Systems Report</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Systems that haven't been patched in 30+ days
          </p>
          <button className="btn btn-primary">
            <Download className="h-4 w-4 mr-2" />
            Generate Report
          </button>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium text-gray-900">Reboot Required Report</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Systems that require a reboot to complete updates
          </p>
          <button className="btn btn-primary">
            <Download className="h-4 w-4 mr-2" />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  )
}
