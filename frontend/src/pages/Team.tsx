import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { usersApi } from '../services/api'
import type { User } from '../types'
import { getErrorMessage } from '../utils/errorMessage'
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { dialogPaperSx, dialogTitleSx, dialogContentSx, dialogActionsSx, dialogBackdropSx } from '../components/AppDialog'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
}

const ROLE_OPTIONS = [
  { value: 'staff', label: 'Staff' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
] as const

const pageSize = 20

export function Team() {
  const [list, setList] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    telephone: '',
    role: 'staff' as string,
  })

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await usersApi.list({ page })
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
    setShowPassword(false)
    setForm({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      telephone: '',
      role: 'staff',
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.username.trim() || !form.email.trim() || !form.password) return
    try {
      await usersApi.create({
        username: form.username,
        email: form.email,
        password: form.password,
        first_name: form.first_name || undefined,
        last_name: form.last_name || undefined,
        telephone: form.telephone || undefined,
        role: form.role,
      })
      setOpen(false)
      toast.success('Team member added.')
      load()
    } catch (e: unknown) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Team</h1>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Add Member
        </Button>
      </div>
      {loading && !list.length ? (
        <div className="flex justify-center py-12">
          <CircularProgress />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Telephone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {list.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.username}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.telephone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }} BackdropProps={{ sx: dialogBackdropSx }}>
        <DialogTitle sx={dialogTitleSx}>Add Team Member</DialogTitle>
        <DialogContent sx={dialogContentSx}>
          <TextField label="Username" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} fullWidth required variant="outlined" size="small" />
          <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} fullWidth required variant="outlined" size="small" />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            fullWidth
            required
            variant="outlined"
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((p) => !p)} onMouseDown={(e) => e.preventDefault()} edge="end" size="small">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField label="First name" value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} fullWidth variant="outlined" size="small" />
          <TextField label="Last name" value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} fullWidth variant="outlined" size="small" />
          <TextField label="Telephone" value={form.telephone} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} fullWidth variant="outlined" size="small" />
          <FormControl fullWidth required size="small">
            <InputLabel id="team-role-label">Role</InputLabel>
            <Select labelId="team-role-label" id="team-role" value={form.role} label="Role" onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              {ROLE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button onClick={() => setOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!form.username.trim() || !form.email.trim() || !form.password} sx={{ borderRadius: 2, px: 3 }}>Create</Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  )
}
