import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { activityLogApi } from '../services/api'
import type { ActivityLog as ActivityLogType } from '../types'
import { CircularProgress, Button } from '@mui/material'

export function ActivityLog() {
  const [list, setList] = useState<ActivityLogType[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await activityLogApi.list({ page })
      setList(data.results || [])
      setTotalCount(data.count ?? 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page])

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Activity Log</h1>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Model</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Object ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {list.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{row.user_username}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            row.action_type === 'CREATE'
                              ? 'bg-green-100 text-green-800'
                              : row.action_type === 'UPDATE'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {row.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.model_name}</td>
                      <td className="px-4 py-3 text-slate-600">{row.object_id}</td>
                      <td className="px-4 py-3 text-slate-500 text-sm">
                        {new Date(row.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
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
    </motion.div>
  )
}
