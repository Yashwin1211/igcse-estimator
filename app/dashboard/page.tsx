'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { SavedEstimate, EstimateResult } from '@/types'

interface SavedEstimateWithResult extends SavedEstimate {
  result: EstimateResult
}

export default function DashboardPage() {
  const [estimates, setEstimates] = useState<SavedEstimateWithResult[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserName(user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? '')
      }

      const res = await fetch('/api/estimates')
      if (res.ok) {
        const data = await res.json()
        setEstimates(data)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function deleteEstimate(id: string) {
    setDeletingId(id)
    const res = await fetch(`/api/estimates/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setEstimates((prev) => prev.filter((e) => e.id !== id))
    }
    setDeletingId(null)
  }

  return (
    <main className="min-h-screen" style={{ background: '#0C0C0C' }}>
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-8 py-5"
        style={{
          borderBottom: '1px solid rgba(30,30,30,0.8)',
          background: 'rgba(12,12,12,0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
        }}
      >
        <Link href="/dashboard" className="font-display text-lg tracking-wide" style={{ color: '#F5F5F0' }}>
          Threshold
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: '#888', fontFamily: 'var(--font-sans)' }}>
            {userName}
          </span>
          <SignOutButton />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <div className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: '#C9A96E', fontFamily: 'var(--font-sans)' }}>
              Dashboard
            </div>
            <h1 className="font-display text-4xl font-light" style={{ color: '#F5F5F0' }}>
              Saved estimates
            </h1>
          </div>
          <Link href="/estimate">
            <Button size="sm" variant="outline">New estimate</Button>
          </Link>
        </motion.div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-sm animate-pulse" style={{ background: '#141414' }} />
            ))}
          </div>
        ) : estimates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 rounded-sm border"
            style={{ background: '#141414', borderColor: '#2A2A2A' }}
          >
            <p className="font-display text-xl font-light mb-2" style={{ color: '#555' }}>
              No saved estimates yet
            </p>
            <p className="text-sm mb-6" style={{ color: '#3D3D3D', fontFamily: 'var(--font-sans)' }}>
              Run an estimate and save your results to see them here.
            </p>
            <Link href="/estimate">
              <Button size="md" variant="primary">Start estimating</Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {estimates.map((est, i) => {
              const result: EstimateResult = est.result
              const grades = result?.entries?.map((e) => e.estimated_grade).filter(Boolean) ?? []

              return (
                <motion.div
                  key={est.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-sm border p-5 flex items-start justify-between"
                  style={{ background: '#141414', borderColor: '#2A2A2A' }}
                >
                  <div>
                    <div className="text-sm mb-1" style={{ color: '#888', fontFamily: 'var(--font-sans)' }}>
                      {format(new Date(est.created_at), 'd MMM yyyy')}
                      {est.label && (
                        <span className="ml-2" style={{ color: '#C9A96E' }}>· {est.label}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {grades.map((grade, gi) => (
                        <span
                          key={gi}
                          className="font-display text-lg"
                          style={{ color: grade === 'A*' ? '#C9A96E' : '#888' }}
                        >
                          {grade}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                      {result?.entries?.length ?? 0} subject{result?.entries?.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteEstimate(est.id)}
                    disabled={deletingId === est.id}
                    className="text-xs transition-colors cursor-pointer disabled:opacity-40 ml-4 flex-shrink-0"
                    style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
                  >
                    {deletingId === est.id ? 'Removing...' : 'Remove'}
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

function SignOutButton() {
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <Button size="sm" variant="ghost" loading={loading} onClick={handleSignOut}>
      Sign out
    </Button>
  )
}
