import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { 
  Settings, 
  Users, 
  Bell, 
  Shield, 
  Database,
  Save,
  RefreshCw
} from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'alerts', name: 'Alerts', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'database', name: 'Database', icon: Database },
  ]

  const handleSave = async () => {
    setIsSaving(true)
    // Implement save functionality
    setTimeout(() => {
      setIsSaving(false)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your patch monitoring configuration</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-primary"
        >
          {isSaving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-6">General Settings</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Application Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Linux Patch Monitor"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Collection Interval (minutes)
                  </label>
                  <input
                    type="number"
                    defaultValue="60"
                    min="15"
                    max="1440"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Data Retention (days)
                  </label>
                  <input
                    type="number"
                    defaultValue="90"
                    min="7"
                    max="365"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-6">User Management</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Current User</h4>
                    <p className="text-sm text-gray-500">{user?.username} ({user?.role})</p>
                  </div>
                  <button className="btn btn-secondary">Edit Profile</button>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">All Users</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b">
                      <div>
                        <span className="text-sm font-medium text-gray-900">admin</span>
                        <span className="ml-2 text-xs text-gray-500">admin@patchmonitor.local</span>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">admin</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <div>
                        <span className="text-sm font-medium text-gray-900">operator1</span>
                        <span className="ml-2 text-xs text-gray-500">operator1@company.com</span>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">operator</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Alert Configuration</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email Notifications
                  </label>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="ml-2 text-sm text-gray-700">Enable email alerts</span>
                    </label>
                    <input
                      type="email"
                      placeholder="admin@company.com"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Alert Thresholds
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500">Patch Lag (days)</label>
                      <input
                        type="number"
                        defaultValue="30"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Security Updates</label>
                      <input
                        type="number"
                        defaultValue="1"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Security Settings</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    defaultValue="30"
                    min="5"
                    max="480"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password Policy
                  </label>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="ml-2 text-sm text-gray-700">Require strong passwords</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="ml-2 text-sm text-gray-700">Enable MFA</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    API Security
                  </label>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="ml-2 text-sm text-gray-700">Enable rate limiting</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="ml-2 text-sm text-gray-700">Require HTTPS</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Database Settings</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Database Type
                  </label>
                  <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm">
                    <option>PostgreSQL with TimescaleDB</option>
                    <option>SQLite (Development)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Connection String
                  </label>
                  <input
                    type="text"
                    defaultValue="postgresql://patchmonitor:***@localhost:5432/patchmonitor"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Backup Schedule
                  </label>
                  <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm">
                    <option>Daily at 2:00 AM</option>
                    <option>Weekly on Sunday</option>
                    <option>Monthly on 1st</option>
                    <option>Disabled</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
