export type Role = 'superadmin' | 'admin' | 'manager' | 'staff'

export interface Organization {
  id: number
  name: string
  subscription_plan: 'Basic' | 'Pro'
  br_number: string | null
  created: string
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  telephone: string
  role: Role
  organization: number | null
  organization_detail?: Organization | null
  is_active: boolean
  created: string
}

export interface Company {
  id: number
  name: string
  industry: string
  country: string
  logo: string | null
  logo_url: string | null
  organization: number
  organization_name?: string | null
  is_deleted: boolean
  created: string
}

export interface Contact {
  id: number
  full_name: string
  email: string
  phone: string
  role: string
  company: number
  organization: number
  is_deleted: boolean
  created: string
}

export interface ActivityLog {
  id: number
  user: number
  user_username: string
  action_type: 'CREATE' | 'UPDATE' | 'DELETE'
  model_name: string
  object_id: string
  timestamp: string
  organization_id: number | null
  extra_data: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiError {
  success?: false
  error?: { code: number; message: string | Record<string, string[]> }
  data?: null
}
