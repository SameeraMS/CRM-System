import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { organizationsApi } from '../services/api'
import type { Organization } from '../types'
import { getErrorMessage } from '../utils/errorMessage'
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

const pageSize = 20

export function Organizations() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'superadmin'

  const [list, setList] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [editForm, setEditForm] = useState({ name: '', subscription_plan: 'Basic' as 'Basic' | 'Pro', br_number: '' })
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [form, setForm] = useState({
    name: '',
    subscription_plan: 'Basic' as 'Basic' | 'Pro',
    br_number: '',
    admin_username: '',
    admin_email: '',
    admin_password: '',
    admin_telephone: '',
  })

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await organizationsApi.list({ page })
      setList(data.results || [])
      setTotalCount(data.count ?? 0)
    } catch (e: unknown) {
      toast.error(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page])

  const handleOpen = () => {
    setShowAdminPassword(false)
    setForm({
      name: '',
      subscription_plan: 'Basic',
      br_number: '',
      admin_username: '',
      admin_email: '',
      admin_password: '',
      admin_telephone: '',
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.admin_username || !form.admin_email || !form.admin_password) return
    setLoading(true)
    try {
      await organizationsApi.create({
        name: form.name,
        subscription_plan: form.subscription_plan,
        br_number: form.br_number || undefined,
        admin_username: form.admin_username,
        admin_email: form.admin_email,
        admin_password: form.admin_password,
        admin_telephone: form.admin_telephone || undefined,
      })
      setOpen(false)
      toast.success('Organization and admin user created.')
      load()
    } catch (e: unknown) {
      toast.error(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  const handleEditOpen = (org: Organization) => {
    setEditingOrg(org)
    setEditForm({
      name: org.name,
      subscription_plan: org.subscription_plan,
      br_number: org.br_number || '',
    })
    setEditOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editingOrg || !editForm.name.trim()) return
    try {
      await organizationsApi.update(editingOrg.id, {
        name: editForm.name,
        subscription_plan: editForm.subscription_plan,
        br_number: editForm.br_number || undefined,
      })
      setEditOpen(false)
      setEditingOrg(null)
      toast.success('Organization updated.')
      load()
    } catch (e: unknown) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 md:p-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Organizations</h1>
        {isSuperAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
            Add Organization
          </Button>
        )}
      </div>
      {loading && !list.length ? (
        <div className="flex justify-center py-12">
          <CircularProgress />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {list.map((org, i) => (
              <motion.div
                key={org.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-800">{org.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Plan: {org.subscription_plan} {org.br_number && `• BR: ${org.br_number}`}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">Created {new Date(org.created).toLocaleDateString()}</p>
                  </div>
                  {isSuperAdmin && (
                    <IconButton size="small" onClick={() => handleEditOpen(org)} aria-label="Edit organization" color="primary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {list.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} size="small">
            Previous
          </Button>
          <span className="text-sm text-slate-600">
            Page {page} of {Math.ceil(totalCount / pageSize) || 1}
          </span>
          <Button
            disabled={page >= Math.ceil(totalCount / pageSize)}
            onClick={() => setPage((p) => p + 1)}
            size="small"
          >
            Next
          </Button>
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Organization & Admin</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-2">
          <TextField
            label="Organization name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
            required
          />
          <TextField
            select
            label="Plan"
            value={form.subscription_plan}
            onChange={(e) => setForm((f) => ({ ...f, subscription_plan: e.target.value as 'Basic' | 'Pro' }))}
            fullWidth
          >
            <MenuItem value="Basic">Basic</MenuItem>
            <MenuItem value="Pro">Pro</MenuItem>
          </TextField>
          <TextField
            label="BR number (unique)"
            value={form.br_number}
            onChange={(e) => setForm((f) => ({ ...f, br_number: e.target.value }))}
            fullWidth
          />
          <div className="border-t pt-4 mt-2">
            <p className="text-sm font-medium text-slate-600 mb-2">Admin user</p>
            <TextField
              label="Username"
              value={form.admin_username}
              onChange={(e) => setForm((f) => ({ ...f, admin_username: e.target.value }))}
              fullWidth
              className="mb-2"
              required
            />
            <TextField
              label="Email"
              type="email"
              value={form.admin_email}
              onChange={(e) => setForm((f) => ({ ...f, admin_email: e.target.value }))}
              fullWidth
              className="mb-2"
              required
            />
            <TextField
              label="Password"
              type={showAdminPassword ? 'text' : 'password'}
              value={form.admin_password}
              onChange={(e) => setForm((f) => ({ ...f, admin_password: e.target.value }))}
              fullWidth
              className="mb-2"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowAdminPassword((p) => !p)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                    >
                      {showAdminPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Telephone"
              value={form.admin_telephone}
              onChange={(e) => setForm((f) => ({ ...f, admin_telephone: e.target.value }))}
              fullWidth
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!form.name || !form.admin_username || !form.admin_email || !form.admin_password}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => { setEditOpen(false); setEditingOrg(null) }} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Organization</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-2">
          <TextField
            label="Organization name"
            value={editForm.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
            required
          />
          <TextField
            select
            label="Plan"
            value={editForm.subscription_plan}
            onChange={(e) => setEditForm((f) => ({ ...f, subscription_plan: e.target.value as 'Basic' | 'Pro' }))}
            fullWidth
          >
            <MenuItem value="Basic">Basic</MenuItem>
            <MenuItem value="Pro">Pro</MenuItem>
          </TextField>
          <TextField
            label="BR number (unique)"
            value={editForm.br_number}
            onChange={(e) => setEditForm((f) => ({ ...f, br_number: e.target.value }))}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditOpen(false); setEditingOrg(null) }}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSubmit} disabled={!editForm.name.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  )
}
