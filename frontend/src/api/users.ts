import apiClient from './client'

export type UserRole = 'admin' | 'operator' | 'viewer'

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  mfa_enabled: boolean
  is_active: boolean
  last_login?: string
  created_at: string
}

export interface UserCreate {
  username: string
  email: string
  password: string
  role: UserRole
}

export interface UserUpdate {
  username?: string
  email?: string
  password?: string
  role?: UserRole
  mfa_enabled?: boolean
}

export const usersApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/api/users')
    return response.data
  },

  getUser: async (userId: string): Promise<User> => {
    const response = await apiClient.get(`/api/users/${userId}`)
    return response.data
  },

  createUser: async (user: UserCreate): Promise<User> => {
    const response = await apiClient.post('/api/users', user)
    return response.data
  },

  updateUser: async (userId: string, user: UserUpdate): Promise<User> => {
    const response = await apiClient.put(`/api/users/${userId}`, user)
    return response.data
  },

  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/api/users/${userId}`)
  },
}

