import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { companiesApi, contactsApi } from '../services/api'
import type { Company, Contact } from '../types'
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
  Alert,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { dialogPaperSx, dialogTitleSx, dialogContentSx, dialogActionsSx, dialogBackdropSx } from '../components/AppDialog'

interface CompanyDetailProps {
  basePath?: string
}

export function CompanyDetail({ basePath = '/dashboard' }: CompanyDetailProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canEditContact = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'superadmin'
  const canDeleteContact = user?.role === 'admin' || user?.role === 'superadmin'
  const backPath = basePath === '/superadmin/companies' ? '/superadmin/companies' : '/dashboard'

  const [company, setCompany] = useState<Company | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactsPage, setContactsPage] = useState(1)
  const [contactsTotalCount, setContactsTotalCount] = useState(0)
  const contactsPageSize = 20
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [openContact, setOpenContact] = useState(false)
  const [contactForm, setContactForm] = useState({ full_name: '', email: '', phone: '', role: '' })
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [companyLogoUrlFailed, setCompanyLogoUrlFailed] = useState(false)

  const companyId = id ? parseInt(id, 10) : 0

  const isFullUrl = (s: string | null | undefined): s is string =>
    typeof s === 'string' && /^https?:\/\//i.test(s)

  const getCompanyLogoSrc = (c: Company | null): string | null => {
    if (!c) return null
    if (companyLogoUrlFailed && isFullUrl(c.logo)) return c.logo
    if (c.logo_url) return c.logo_url
    if (isFullUrl(c.logo)) return c.logo
    return null
  }

  const loadCompany = async () => {
    if (!companyId) return
    try {
      const { data } = await companiesApi.get(companyId)
      setCompany(data)
      setCompanyLogoUrlFailed(false)
      setNotFound(false)
    } catch (e: unknown) {
      toast.error(getErrorMessage(e))
      setCompany(null)
      setNotFound(true)
    }
  }

  const loadContacts = async () => {
    if (!companyId) return
    try {
      const { data } = await contactsApi.listByCompany(companyId, { page: contactsPage })
      setContacts(data.results || [])
      setContactsTotalCount(data.count ?? 0)
    } catch {
      setContacts([])
      setContactsTotalCount(0)
    }
  }

  useEffect(() => {
    if (!companyId) return
    setLoading(true)
    setContactsPage(1)
    loadCompany().finally(() => setLoading(false))
  }, [companyId])

  useEffect(() => {
    if (!companyId) return
    loadContacts()
  }, [companyId, contactsPage])

  const handleAddContact = () => {
    setEditingContact(null)
    setContactForm({ full_name: '', email: '', phone: '', role: '' })
    setOpenContact(true)
  }

  const handleEditContact = (c: Contact) => {
    setEditingContact(c)
    setContactForm({ full_name: c.full_name, email: c.email, phone: c.phone || '', role: c.role || '' })
    setOpenContact(true)
  }

  const handleSaveContact = async () => {
    if (!companyId || !contactForm.full_name.trim() || !contactForm.email.trim()) return
    try {
      if (editingContact) {
        await contactsApi.update(editingContact.id, contactForm)
        toast.success('Contact updated.')
      } else {
        await contactsApi.createForCompany(companyId, contactForm)
        toast.success('Contact added.')
      }
      setOpenContact(false)
      loadContacts()
    } catch (e: unknown) {
      toast.error(getErrorMessage(e))
    }
  }

  const handleDeleteContact = async (contactId: number) => {
    if (!window.confirm('Delete this contact?')) return
    try {
      await contactsApi.delete(contactId)
      toast.success('Contact removed.')
      loadContacts()
    } catch (e: unknown) {
      toast.error(getErrorMessage(e))
    }
  }

  if (loading && !company) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <CircularProgress />
      </div>
    )
  }
  if (!loading && (notFound || !company)) {
    return (
      <div className="p-6">
        <Alert severity="error">Company not found. It may have been removed or you don&apos;t have access.</Alert>
        <Button className="mt-4" onClick={() => navigate(backPath)}>Back to Companies</Button>
      </div>
    )
  }

  if (!company) return null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-8">
      <div className="flex items-center gap-4 mb-6">
        <IconButton onClick={() => navigate(backPath)} size="small" aria-label="Back">
          <ArrowBackIcon />
        </IconButton>
        {getCompanyLogoSrc(company) ? (
          <img
            src={getCompanyLogoSrc(company)!}
            alt=""
            className="w-14 h-14 rounded-lg object-cover border border-slate-200"
            referrerPolicy="no-referrer"
            onError={() => setCompanyLogoUrlFailed(true)}
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 text-sm">No logo</div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">{company.name}</h1>
          <p className="text-slate-500">
            {company.industry && `${company.industry} • `}
            {company.country || '—'}
          </p>
        </div>
      </div>
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-700 mb-3">Contacts</h2>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddContact} className="mb-4">
          Add Contact
        </Button>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Role</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {contacts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.email}</td>
                  <td className="px-4 py-3 text-slate-600">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{c.role || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {canEditContact && (
                      <IconButton size="small" onClick={() => handleEditContact(c)} aria-label="Edit">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {canDeleteContact && (
                      <IconButton size="small" onClick={() => handleDeleteContact(c.id)} aria-label="Delete" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!contacts.length && (
            <div className="px-4 py-8 text-center text-slate-500">No contacts yet. Add one above.</div>
          )}
        </div>
        {contacts.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              disabled={contactsPage <= 1}
              onClick={() => setContactsPage((p) => p - 1)}
              size="small"
            >
              Previous
            </Button>
            <span className="text-sm text-slate-600">
              Page {contactsPage} of {Math.ceil(contactsTotalCount / contactsPageSize) || 1}
            </span>
            <Button
              disabled={contactsPage >= Math.ceil(contactsTotalCount / contactsPageSize)}
              onClick={() => setContactsPage((p) => p + 1)}
              size="small"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <Dialog open={openContact} onClose={() => setOpenContact(false)} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }} BackdropProps={{ sx: dialogBackdropSx }}>
        <DialogTitle sx={dialogTitleSx}>{editingContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        <DialogContent sx={dialogContentSx}>
          <TextField
            label="Full name"
            value={contactForm.full_name}
            onChange={(e) => setContactForm((f) => ({ ...f, full_name: e.target.value }))}
            fullWidth
            required
            variant="outlined"
            size="small"
          />
          <TextField
            label="Email"
            type="email"
            value={contactForm.email}
            onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
            fullWidth
            required
            disabled={!!editingContact}
            variant="outlined"
            size="small"
          />
          <TextField
            label="Phone (8–15 digits)"
            value={contactForm.phone}
            onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
            fullWidth
            variant="outlined"
            size="small"
          />
          <TextField
            label="Role"
            value={contactForm.role}
            onChange={(e) => setContactForm((f) => ({ ...f, role: e.target.value }))}
            fullWidth
            variant="outlined"
            size="small"
          />
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button onClick={() => setOpenContact(false)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveContact} disabled={!contactForm.full_name.trim() || !contactForm.email.trim()} sx={{ borderRadius: 2, px: 3 }}>
            {editingContact ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  )
}
