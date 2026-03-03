/** Shared styles for modern modal dialogs. Use with MUI Dialog, DialogTitle, DialogContent, DialogActions. */
export const dialogPaperSx = {
  borderRadius: 3,
  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)',
  overflow: 'hidden',
}

export const dialogTitleSx = {
  background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
  color: 'white',
  fontWeight: 700,
  fontSize: '1.25rem',
  py: 2,
  px: 3,
  letterSpacing: '-0.02em',
}

export const dialogContentSx = {
  py: 3,
  px: 3,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 2.5,
  bgcolor: '#fafafa',
}

export const dialogActionsSx = {
  px: 3,
  py: 2,
  gap: 1.5,
  borderTop: '1px solid #e2e8f0',
  bgcolor: 'white',
}

export const dialogBackdropSx = { backdropFilter: 'blur(4px)' }

/** Section block for grouping form fields (e.g. "Admin user", "Image / Logo") */
export function DialogSection({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ${className}`}
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' }}
    >
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-600">{title}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}
