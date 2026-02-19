'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
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
        placeholder="••••••••"
        required
        autoComplete="current-password"
      />
      {error && (
        <p
          className="text-xs p-3 rounded-sm"
          style={{
            color: '#CF6679',
            background: 'rgba(207,102,121,0.1)',
            border: '1px solid rgba(207,102,121,0.2)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {error}
        </p>
      )}
      <Button type="submit" fullWidth loading={loading} size="md">
        Sign in
      </Button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-8"
      style={{ background: '#0C0C0C' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <Link href="/" className="block text-center mb-10">
          <span
            className="font-display text-2xl tracking-wide"
            style={{ color: '#F5F5F0' }}
          >
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
          <h1
            className="font-display text-2xl font-light mb-1"
            style={{ color: '#F5F5F0' }}
          >
            Welcome back
          </h1>
          <p
            className="text-sm mb-6"
            style={{ color: '#888', fontFamily: 'var(--font-sans)' }}
          >
            Sign in to access your saved estimates.
          </p>

          <Suspense fallback={<div className="h-40 animate-pulse rounded-sm" style={{ background: '#1A1A1A' }} />}>
            <LoginForm />
          </Suspense>
        </div>

        <p
          className="text-center text-sm mt-5"
          style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
        >
          No account?{' '}
          <Link
            href="/auth/signup"
            className="transition-colors"
            style={{ color: '#888' }}
          >
            Create one
          </Link>
        </p>

        <p className="text-center mt-4">
          <Link
            href="/estimate"
            className="text-xs transition-colors"
            style={{ color: '#3D3D3D', fontFamily: 'var(--font-sans)' }}
          >
            Continue without signing in
          </Link>
        </p>
      </motion.div>
    </main>
  )
}
