'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { EstimateProvider, useEstimate } from '@/components/estimate/EstimateContext'
import { SubjectSelector } from '@/components/estimate/SubjectSelector'
import { PaperSelector } from '@/components/estimate/PaperSelector'
import { MarkInput } from '@/components/estimate/MarkInput'
import { ReviewStep } from '@/components/estimate/ReviewStep'
import { Stepper } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { trackEvent } from '@/lib/analytics'

const STEPS = [
  { label: 'Subjects' },
  { label: 'Papers' },
  { label: 'Marks' },
  { label: 'Review' },
]

function EstimatorContent() {
  const { step } = useEstimate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    trackEvent('page_view', { path: '/estimate' })

    createClient().auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
  }, [])

  return (
    <main className="min-h-screen relative" style={{ background: '#0C0C0C' }}>
      {/* Ambient top glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(201,169,110,0.05) 0%, transparent 60%)',
          zIndex: 0,
        }}
      />

      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-8 py-4"
        style={{
          borderBottom: '1px solid rgba(42,42,42,0.6)',
          background: 'rgba(12,12,12,0.9)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
        }}
      >
        <Link
          href={isLoggedIn ? '/dashboard' : '/'}
          className="font-display text-xl tracking-wide transition-opacity hover:opacity-70"
          style={{ color: '#F5F5F0' }}
        >
          Threshold
        </Link>

        <div
          className="text-xs tracking-[0.2em] uppercase hidden sm:block"
          style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
        >
          {STEPS[step]?.label} &middot; {step + 1} of {STEPS.length}
        </div>

        {isLoggedIn ? (
          <Link
            href="/dashboard"
            className="text-sm transition-colors hover:opacity-80"
            style={{ color: '#888', fontFamily: 'var(--font-sans)' }}
          >
            Dashboard
          </Link>
        ) : (
          <Link
            href="/auth/login"
            className="text-sm transition-colors hover:opacity-80"
            style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
          >
            Sign in
          </Link>
        )}
      </nav>

      {/* Gold progress bar */}
      <div className="h-px relative z-50" style={{ background: '#1A1A1A' }}>
        <motion.div
          className="absolute inset-y-0 left-0"
          style={{
            background: 'linear-gradient(to right, #C9A96E, rgba(201,169,110,0.3))',
            boxShadow: '0 0 8px rgba(201,169,110,0.4)',
          }}
          animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>

      <div className="max-w-3xl mx-auto px-8 py-12 relative z-10">
        {/* Stepper */}
        <div className="mb-10">
          <Stepper steps={STEPS} currentStep={step} />
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {step === 0 && <SubjectSelector />}
            {step === 1 && <PaperSelector />}
            {step === 2 && <MarkInput />}
            {step === 3 && <ReviewStep />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  )
}

export default function EstimatePage() {
  return (
    <EstimateProvider>
      <EstimatorContent />
    </EstimateProvider>
  )
}
