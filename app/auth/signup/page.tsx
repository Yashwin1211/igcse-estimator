'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { getSessionId, clearSessionId } from '@/lib/utils/session'
import { trackEvent } from '@/lib/analytics'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Step 1: create the user server-side (email pre-confirmed, no inbox required)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })

    const body = await res.json()

    if (!res.ok) {
      setError(body.error ?? 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    // Step 2: sign in to establish the session cookie
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    trackEvent('user_signed_up')

    // Claim any guest estimates
    const sessionId = getSessionId()
    if (sessionId) {
      try {
        await fetch(`/api/estimates/${sessionId}/claim`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        })
        clearSessionId()
      } catch {
        // Non-critical — estimates can be claimed later
      }
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-8" style={{ background: '#0C0C0C' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <Link href="/" className="block text-center mb-10">
          <span className="font-display text-2xl tracking-wide" style={{ color: '#F5F5F0' }}>
            Threshold
          </span>
        </Link>

        <div
          className="rounded-sm border p-8"
          style={{
            background: 'linear-gradient(160deg, #181818 0%, #141414 100%)',
            borderColor: '#2A2A2A',
            boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 40px rgba(0,0,0,0.5)',
          }}
        >
          <h1 className="font-display text-2xl font-light mb-1" style={{ color: '#F5F5F0' }}>
            Create account
          </h1>
          <p className="text-sm mb-6" style={{ color: '#888', fontFamily: 'var(--font-sans)' }}>
            Save your estimates and track your progress.
          </p>

          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              label="Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />

            {error && (
              <p className="text-xs p-3 rounded-sm" style={{ color: '#CF6679', background: 'rgba(207,102,121,0.1)', border: '1px solid rgba(207,102,121,0.2)', fontFamily: 'var(--font-sans)' }}>
                {error}
              </p>
            )}

            <Button type="submit" fullWidth loading={loading} size="md">
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: '#888' }}>
            Sign in
          </Link>
        </p>
      </motion.div>
    </main>
  )
}
