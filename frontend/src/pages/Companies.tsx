import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { companiesApi, organizationsApi } from '../services/api'
import type { Company, Organization } from '../types'
import { getErrorMessage } from '../utils/errorMessage'
import {
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DeleteIcon from '@mui/icons-material/Delete'

interface CompaniesProps {
  basePath?: string
}

export function Companies({ basePath = '/dashboard/companies' }: CompaniesProps) {
  const { user } = useAuth()
  const isSuperAdmin = basePath === '/superadmin/companies'
  const canDelete = user?.role === 'admin' || user?.role === 'superadmin'
  const canEdit = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'superadmin'

  const [list, setList] = useState<Company[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterOrgId, setFilterOrgId] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [form, setForm] = useState({ name: '', industry: '', country: '', organizationId: '' })
  const [editForm, setEditForm] = useState({ name: '', industry: '', country: '' })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20
  const [logoUrlFailedIds, setLogoUrlFailedIds] = useState<Set<number>>(() => new Set())
  const [editLogoUrlFailed, setEditLogoUrlFailed] = useState(false)

  const isFullUrl = (s: string | null | undefined): s is string =>
    typeof s === 'string' && /^https?:\/\//i.test(s)

  const getCompanyLogoSrc = (row: Company): string | null => {
    if (logoUrlFailedIds.has(row.id) && isFullUrl(row.logo)) return row.logo
    if (row.logo_url) return row.logo_url
    if (isFullUrl(row.logo)) return row.logo
    return null
  }

  const handleLogoError = (companyId: number) => {
    setLogoUrlFailedIds((prev) => new Set(prev).add(companyId))
  }

  const getEditDialogLogoSrc = (): string | null => {
    if (!editingCompany) return null
    if (editLogoUrlFailed && isFullUrl(editingCompany.logo)) return editingCompany.logo
    if (editingCompany.logo_url) return editingCompany.logo_url
    if (isFullUrl(editingCompany.logo)) return editingCompany.logo
    return null
  }

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await companiesApi.list({
        page,
        search: search || undefined,
        ordering: '-created',
        organization: isSuperAdmin && filterOrgId ? Number(filterOrgId) : undefined,
      })
      setList(data.results || [])
      setTotalCount(data.count ?? 0)
    } catch (e: unknown) {
      toast.error(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSuperAdmin) {
      organizationsApi.list().then(({ data }) => setOrganizations(data.results || [])).catch(() => setOrganizations([]))
    }
  }, [isSuperAdmin])

  useEffect(() => {
    setPage(1)
  }, [search, filterOrgId])

  useEffect(() => {
    load()
  }, [page, search, filterOrgId])

  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [editLogoPreviewUrl, setEditLogoPreviewUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!logoFile) {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
      setLogoPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(logoFile)
    setLogoPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [logoFile])
  useEffect(() => {
    if (!editLogoFile) {
      setEditLogoPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(editLogoFile)
    setEditLogoPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [editLogoFile])

  const handleOpen = async () => {
    setForm({ name: '', industry: '', country: '', organizationId: '' })
    setLogoFile(null)
    setOpen(true)
    if (isSuperAdmin) {
      try {
        const { data } = await organizationsApi.list()
        setOrganizations(data.results || [])
      } catch {
        setOrganizations([])
      }
    }
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    if (isSuperAdmin && !form.organizationId) {
      toast.error('Please select an organization.')
      return
    }
    setLoading(true)
    try {
      await companiesApi.create({
        name: form.name,
        industry: form.industry || undefined,
        country: form.country || undefined,
        logo: logoFile || undefined,
        organization: isSuperAdmin ? Number(form.organizationId) : undefined,
      })
      setOpen(false)
      toast.success('Company created.')
      load()
    } catch (e: unknown) {
      toast.error(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Soft delete this company?')) return
    try {
      await companiesApi.delete(id)
      toast.success('Company removed.')
      load()
    } catch (e: unknown) {
      toast.error(getErrorMessage(e))
    }
  }

  const handleEditOpen = (company: Company) => {
    setEditingCompany(company)
    setEditForm({ name: company.name, industry: company.industry || '', country: company.country || '' })
    setEditLogoFile(null)
    setEditLogoUrlFailed(false)
    setEditOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editingCompany || !editForm.name.trim()) return
    try {
      await companiesApi.update(editingCompany.id, {
        name: editForm.name,
        industry: editForm.industry || undefined,
        country: editForm.country || undefined,
        logo: editLogoFile || undefined,
      })
      setEditOpen(false)
      setEditingCompany(null)
      toast.success('Company updated.')
      load()
    } catch (e: unknown) {
      toast.error(getErrorMessage(e))
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Companies</h1>
        <div className="flex flex-wrap items-center gap-2">
          <TextField
            size="small"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            className="w-48"
          />
          {isSuperAdmin && (
            <FormControl size="small" className="w-40">
              <InputLabel id="filter-org-label">Filter by organization</InputLabel>
              <Select
                labelId="filter-org-label"
                value={filterOrgId}
                label="Filter by organization"
                onChange={(e) => setFilterOrgId(e.target.value)}
              >
                <MenuItem value="">All organizations</MenuItem>
                {organizations.map((org) => (
                  <MenuItem key={org.id} value={String(org.id)}>{org.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
            Add Company
          </Button>
        </div>
      </div>
      {loading && !list.length ? (
        <div className="flex justify-center py-12">
          <CircularProgress />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase w-20">Image</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Name</th>
                    {isSuperAdmin && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Organization</th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Industry</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Country</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <AnimatePresence mode="popLayout">
                    {list.map((row, i) => (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          {getCompanyLogoSrc(row) ? (
                            <img
                              src={getCompanyLogoSrc(row)!}
                              alt={row.name}
                              className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                              referrerPolicy="no-referrer"
                              onError={() => handleLogoError(row.id)}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 text-xs">No image</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`${basePath}/${row.id}`} className="font-medium text-indigo-600 hover:underline">
                            {row.name}
                          </Link>
                        </td>
                        {isSuperAdmin && (
                          <td className="px-4 py-3 text-slate-600">{row.organization_name ?? '—'}</td>
                        )}
                        <td className="px-4 py-3 text-slate-600">{row.industry || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{row.country || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <IconButton size="small" component={Link} to={`${basePath}/${row.id}`} aria-label="View">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          {canEdit && (
                            <IconButton size="small" onClick={() => handleEditOpen(row)} aria-label="Edit">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                          {canDelete && (
                            <IconButton size="small" onClick={() => handleDelete(row.id)} aria-label="Delete" color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Company</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-2">
          {isSuperAdmin && (
            <FormControl fullWidth required>
              <InputLabel id="company-org-label">Organization</InputLabel>
              <Select
                labelId="company-org-label"
                value={form.organizationId}
                label="Organization"
                onChange={(e) => setForm((f) => ({ ...f, organizationId: e.target.value }))}
              >
                {organizations.map((org) => (
                  <MenuItem key={org.id} value={String(org.id)}>{org.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
            required
          />
          <TextField label="Industry" value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} fullWidth />
          <TextField label="Country" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} fullWidth />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Image / Logo</label>
            <p className="text-xs text-slate-500">Select a logo image (optional). Stored on server or AWS S3.</p>
            <div className="border-2 border-dashed border-indigo-200 rounded-lg p-4 text-center hover:border-indigo-400 bg-indigo-50/50 transition-colors">
              <input
                id="company-logo-upload"
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <label htmlFor="company-logo-upload" className="cursor-pointer flex flex-col items-center gap-2">
                {logoFile && logoPreviewUrl ? (
                  <>
                    <img src={logoPreviewUrl} alt="Preview" className="max-h-24 rounded object-contain border border-slate-200" />
                    <span className="text-sm text-indigo-600 font-medium">{logoFile.name}</span>
                    <span className="text-xs text-slate-500">Click to change image</span>
                  </>
                ) : (
                  <>
                    <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-slate-700">Click to select image</span>
                    <span className="text-xs text-slate-500">PNG, JPG or GIF</span>
                  </>
                )}
              </label>
            </div>
            {logoFile && (
              <Button size="small" onClick={() => setLogoFile(null)} color="secondary">Remove image</Button>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!form.name.trim() || (isSuperAdmin && !form.organizationId)}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => { setEditOpen(false); setEditingCompany(null) }} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Company</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-2">
          <TextField
            label="Name"
            value={editForm.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
            required
          />
          <TextField label="Industry" value={editForm.industry} onChange={(e) => setEditForm((f) => ({ ...f, industry: e.target.value }))} fullWidth />
          <TextField label="Country" value={editForm.country} onChange={(e) => setEditForm((f) => ({ ...f, country: e.target.value }))} fullWidth />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Image / Logo</label>
            <p className="text-xs text-slate-500">Change logo (optional). Leave unchanged or select a new image.</p>
            <div className="border-2 border-dashed border-indigo-200 rounded-lg p-4 text-center hover:border-indigo-400 bg-indigo-50/50 transition-colors">
              <input
                id="company-edit-logo-upload"
                type="file"
                accept="image/*"
                onChange={(e) => setEditLogoFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <label htmlFor="company-edit-logo-upload" className="cursor-pointer flex flex-col items-center gap-2">
                {editLogoFile && editLogoPreviewUrl ? (
                  <>
                    <img src={editLogoPreviewUrl} alt="Preview" className="max-h-24 rounded object-contain border border-slate-200" />
                    <span className="text-sm text-indigo-600 font-medium">{editLogoFile.name}</span>
                    <span className="text-xs text-slate-500">Click to change image</span>
                  </>
                ) : getEditDialogLogoSrc() ? (
                  <>
                    <img
                      src={getEditDialogLogoSrc()!}
                      alt="Current"
                      className="max-h-24 rounded object-contain border border-slate-200"
                      referrerPolicy="no-referrer"
                      onError={() => setEditLogoUrlFailed(true)}
                    />
                    <span className="text-xs text-slate-500">Click to replace with new image</span>
                  </>
                ) : (
                  <>
                    <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-slate-700">Click to select image</span>
                    <span className="text-xs text-slate-500">PNG, JPG or GIF</span>
                  </>
                )}
              </label>
            </div>
            {editLogoFile && (
              <Button size="small" onClick={() => setEditLogoFile(null)} color="secondary">Clear new image</Button>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditOpen(false); setEditingCompany(null) }}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSubmit} disabled={!editForm.name.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  )
}
