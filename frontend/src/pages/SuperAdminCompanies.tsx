import { Companies } from './Companies'

/** Superadmin view: all companies across all organizations (CRUD). */
export function SuperAdminCompanies() {
  return <Companies basePath="/superadmin/companies" />
}
