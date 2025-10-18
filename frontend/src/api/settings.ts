import apiClient from './client'

export interface Settings {
  application_name: string
  collection_interval: string
  data_retention_days: string
  email_notifications_enabled: string
  email_address: string
  alert_threshold_patch_lag_days: string
  alert_threshold_security_updates: string
  session_timeout_minutes: string
  require_strong_passwords: string
  enable_mfa: string
  enable_rate_limiting: string
  require_https: string
  database_type: string
  database_connection_string: string
  backup_schedule: string
  [key: string]: string // Allow dynamic keys
}

export interface SettingsResponse {
  settings: Settings
}

export interface SettingsUpdate {
  settings: Partial<Settings>
}

export const settingsApi = {
  getSettings: async (): Promise<SettingsResponse> => {
    const response = await apiClient.get('/api/settings')
    return response.data
  },

  updateSettings: async (settings: Partial<Settings>): Promise<SettingsResponse> => {
    const response = await apiClient.put('/api/settings', { settings })
    return response.data
  },
}

