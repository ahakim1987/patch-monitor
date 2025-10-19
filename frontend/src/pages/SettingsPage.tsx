import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { settingsApi, Settings as SettingsType, AgentToken } from '../api/settings'
import { usersApi, User, UserCreate, UserUpdate } from '../api/users'
import { 
  Settings, 
  Users, 
  Bell, 
  Shield, 
  Database,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general')
  const [formData, setFormData] = useState<Partial<SettingsType>>({})
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // User management state
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userFormData, setUserFormData] = useState<Partial<UserCreate & UserUpdate>>({})
  const [deleteConfirmUserId, setDeleteConfirmUserId] = useState<string | null>(null)
  
  // Agent token state
  const [showAgentToken, setShowAgentToken] = useState(false)
  const [tokenCopied, setTokenCopied] = useState(false)

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'alerts', name: 'Alerts', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'database', name: 'Database', icon: Database },
  ]

  // Load settings from API
  const { data: settingsData, isLoading } = useQuery(
    'settings',
    settingsApi.getSettings
  )

  // Update formData when settings are loaded
  useEffect(() => {
    if (settingsData?.settings) {
      setFormData(settingsData.settings)
    }
  }, [settingsData])

  // Mutation for saving settings
  const saveMutation = useMutation(
    (settings: Partial<SettingsType>) => settingsApi.updateSettings(settings),
    {
      onSuccess: (data) => {
        queryClient.setQueryData('settings', data)
        setFormData(data.settings)
        setSaveMessage({ type: 'success', text: 'Settings saved successfully!' })
        setTimeout(() => setSaveMessage(null), 3000)
      },
      onError: (error: any) => {
        setSaveMessage({ 
          type: 'error', 
          text: error.response?.data?.detail || 'Failed to save settings. Please try again.' 
        })
        setTimeout(() => setSaveMessage(null), 5000)
      }
    }
  )

  // Agent token query
  const { data: agentToken } = useQuery<AgentToken>('agent-token', settingsApi.getAgentToken)

  // User management queries and mutations
  const { data: users } = useQuery('users', usersApi.getUsers)

  const createUserMutation = useMutation(usersApi.createUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users')
      setShowUserModal(false)
      setUserFormData({})
      setSaveMessage({ type: 'success', text: 'User created successfully!' })
      setTimeout(() => setSaveMessage(null), 3000)
    },
    onError: (error: any) => {
      setSaveMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to create user.' 
      })
      setTimeout(() => setSaveMessage(null), 5000)
    }
  })

  const updateUserMutation = useMutation(
    ({ userId, data }: { userId: string; data: UserUpdate }) =>
      usersApi.updateUser(userId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users')
        setShowUserModal(false)
        setEditingUser(null)
        setUserFormData({})
        setSaveMessage({ type: 'success', text: 'User updated successfully!' })
        setTimeout(() => setSaveMessage(null), 3000)
      },
      onError: (error: any) => {
        setSaveMessage({ 
          type: 'error', 
          text: error.response?.data?.detail || 'Failed to update user.' 
        })
        setTimeout(() => setSaveMessage(null), 5000)
      }
    }
  )

  const deleteUserMutation = useMutation(usersApi.deleteUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users')
      setDeleteConfirmUserId(null)
      setSaveMessage({ type: 'success', text: 'User deleted successfully!' })
      setTimeout(() => setSaveMessage(null), 3000)
    },
    onError: (error: any) => {
      setSaveMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to delete user.' 
      })
      setTimeout(() => setSaveMessage(null), 5000)
    }
  })

  const handleSave = async () => {
    saveMutation.mutate(formData)
  }

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleCheckboxChange = (key: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [key]: checked ? 'true' : 'false' }))
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId })
  }

  const handleAddUser = () => {
    setEditingUser(null)
    setUserFormData({ role: 'viewer' })
    setShowUserModal(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setUserFormData({
      username: user.username,
      email: user.email,
      role: user.role,
    })
    setShowUserModal(true)
  }

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingUser) {
      updateUserMutation.mutate({ userId: editingUser.id, data: userFormData })
    } else {
      createUserMutation.mutate(userFormData as UserCreate)
    }
  }

  const handleDeleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId)
  }

  const handleCopyToken = () => {
    if (agentToken?.agent_token) {
      navigator.clipboard.writeText(agentToken.agent_token)
      setTokenCopied(true)
      setTimeout(() => setTokenCopied(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading settings...</span>
      </div>
    )
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
          disabled={saveMutation.isLoading}
          className="btn btn-primary"
        >
          {saveMutation.isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saveMutation.isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`flex items-center p-4 rounded-md ${
          saveMessage.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {saveMessage.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mr-2" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-2" />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
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
            <>
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-6">General Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Application Name
                    </label>
                    <input
                      type="text"
                      value={formData.application_name || ''}
                      onChange={(e) => handleInputChange('application_name', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Collection Interval (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.collection_interval || ''}
                      onChange={(e) => handleInputChange('collection_interval', e.target.value)}
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
                      value={formData.data_retention_days || ''}
                      onChange={(e) => handleInputChange('data_retention_days', e.target.value)}
                      min="7"
                      max="365"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Agent Token Card */}
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Agent Deployment</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Use this token to install agents on your Linux hosts. Keep it secure!
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent Authentication Token
                    </label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <input
                          type={showAgentToken ? "text" : "password"}
                          value={agentToken?.agent_token || 'Loading...'}
                          readOnly
                          className="block w-full pr-20 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm font-mono bg-gray-50"
                        />
                        <button
                          onClick={() => setShowAgentToken(!showAgentToken)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showAgentToken ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <button
                        onClick={handleCopyToken}
                        className="btn btn-secondary"
                        disabled={!agentToken}
                      >
                        {tokenCopied ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Installation Command</h4>
                    <p className="text-xs text-blue-700 mb-2">Run this on your Linux hosts:</p>
                    <pre className="bg-blue-900 text-blue-100 p-3 rounded text-xs overflow-x-auto">
{`wget http://${window.location.hostname}:8001/api/agents/download/install.sh
chmod +x install.sh
sudo ./install.sh --server-url http://${window.location.hostname}:8001 --token ${agentToken?.agent_token || 'YOUR_TOKEN'}`}
                    </pre>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                <button 
                  onClick={handleAddUser}
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users?.map((userItem) => (
                      <tr key={userItem.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {userItem.username}
                              {userItem.id === user?.id && (
                                <span className="ml-2 text-xs text-gray-500">(You)</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">{userItem.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            userItem.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                            userItem.role === 'operator' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {userItem.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            userItem.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {userItem.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {userItem.last_login 
                            ? new Date(userItem.last_login).toLocaleDateString()
                            : 'Never'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEditUser(userItem)}
                            className="text-primary hover:text-primary-dark"
                          >
                            <Edit2 className="h-4 w-4 inline" />
                          </button>
                          {userItem.id !== user?.id && (
                            <button
                              onClick={() => setDeleteConfirmUserId(userItem.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4 inline" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {users && users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No users found. Add your first user to get started.
                </div>
              )}
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
                      <input 
                        type="checkbox" 
                        checked={formData.email_notifications_enabled === 'true'}
                        onChange={(e) => handleCheckboxChange('email_notifications_enabled', e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary" 
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable email alerts</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email_address || ''}
                      onChange={(e) => handleInputChange('email_address', e.target.value)}
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
                        value={formData.alert_threshold_patch_lag_days || ''}
                        onChange={(e) => handleInputChange('alert_threshold_patch_lag_days', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Security Updates</label>
                      <input
                        type="number"
                        value={formData.alert_threshold_security_updates || ''}
                        onChange={(e) => handleInputChange('alert_threshold_security_updates', e.target.value)}
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
                    value={formData.session_timeout_minutes || ''}
                    onChange={(e) => handleInputChange('session_timeout_minutes', e.target.value)}
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
                      <input 
                        type="checkbox" 
                        checked={formData.require_strong_passwords === 'true'}
                        onChange={(e) => handleCheckboxChange('require_strong_passwords', e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary" 
                      />
                      <span className="ml-2 text-sm text-gray-700">Require strong passwords</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={formData.enable_mfa === 'true'}
                        onChange={(e) => handleCheckboxChange('enable_mfa', e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary" 
                      />
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
                      <input 
                        type="checkbox" 
                        checked={formData.enable_rate_limiting === 'true'}
                        onChange={(e) => handleCheckboxChange('enable_rate_limiting', e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary" 
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable rate limiting</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={formData.require_https === 'true'}
                        onChange={(e) => handleCheckboxChange('require_https', e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary" 
                      />
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
                  <select 
                    value={formData.database_type || ''}
                    onChange={(e) => handleInputChange('database_type', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  >
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
                    value={formData.database_connection_string || ''}
                    onChange={(e) => handleInputChange('database_connection_string', e.target.value)}
                    placeholder="postgresql://patchmonitor:***@localhost:5432/patchmonitor"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Backup Schedule
                  </label>
                  <select 
                    value={formData.backup_schedule || ''}
                    onChange={(e) => handleInputChange('backup_schedule', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  >
                    <option value="daily">Daily at 2:00 AM</option>
                    <option value="weekly">Weekly on Sunday</option>
                    <option value="monthly">Monthly on 1st</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Add/Edit Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button
                onClick={() => {
                  setShowUserModal(false)
                  setEditingUser(null)
                  setUserFormData({})
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.username || ''}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={userFormData.email || ''}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUser && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  minLength={8}
                  value={userFormData.password || ''}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  required
                  value={userFormData.role || 'viewer'}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="viewer">Viewer</option>
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false)
                    setEditingUser(null)
                    setUserFormData({})
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isLoading || updateUserMutation.isLoading}
                  className="btn btn-primary"
                >
                  {createUserMutation.isLoading || updateUserMutation.isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingUser ? 'Update User' : 'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmUserId(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirmUserId)}
                disabled={deleteUserMutation.isLoading}
                className="btn bg-red-600 text-white hover:bg-red-700"
              >
                {deleteUserMutation.isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
