'use client'

import { motion } from 'framer-motion'

export function BackgroundAura() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 2 }}
    >
      {/* Gold blob — top-left, drifts toward center-right */}
      <motion.div
        style={{
          position: 'absolute',
          width: 700,
          height: 700,
          background:
            'radial-gradient(ellipse at 38% 38%, rgba(255,248,220,0.04) 0%, rgba(201,169,110,0.13) 28%, rgba(170,120,40,0.05) 58%, transparent 75%)',
          filter: 'blur(60px)',
          left: -250,
          top: -250,
          willChange: 'transform',
        }}
        animate={{
          x: [0, 140, 70, -40, 110, 0],
          y: [0, 90, 180, 110, 40, 0],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Blue-slate blob — bottom-right, drifts toward center */}
      <motion.div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          background:
            'radial-gradient(ellipse at 62% 62%, rgba(220,235,255,0.03) 0%, rgba(90,115,190,0.10) 32%, rgba(60,80,160,0.04) 62%, transparent 80%)',
          filter: 'blur(70px)',
          right: -200,
          bottom: -200,
          willChange: 'transform',
        }}
        animate={{
          x: [0, -110, -50, 70, -90, 0],
          y: [0, -70, -150, -80, -20, 0],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

      {/* Amber blob — center-left, wanders freely */}
      <motion.div
        style={{
          position: 'absolute',
          width: 450,
          height: 450,
          background:
            'radial-gradient(ellipse at 42% 38%, rgba(255,240,200,0.03) 0%, rgba(195,135,65,0.09) 34%, rgba(150,90,30,0.04) 62%, transparent 80%)',
          filter: 'blur(80px)',
          left: '36vw',
          top: '32vh',
          willChange: 'transform',
        }}
        animate={{
          x: [0, 160, 60, -90, 120, 0],
          y: [0, -100, 80, -60, 40, 0],
          scale: [1, 1.10, 0.95, 1.05, 0.98, 1],
        }}
        transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut', delay: 10 }}
      />

      {/* Subtle violet accent — top-right corner, barely visible */}
      <motion.div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          background:
            'radial-gradient(ellipse at 55% 45%, rgba(200,180,255,0.02) 0%, rgba(130,100,200,0.07) 35%, transparent 70%)',
          filter: 'blur(90px)',
          right: -100,
          top: -100,
          willChange: 'transform',
        }}
        animate={{
          x: [0, -80, 40, -120, 0],
          y: [0, 100, 60, 30, 0],
        }}
        transition={{ duration: 36, repeat: Infinity, ease: 'easeInOut', delay: 16 }}
      />
    </div>
  )
}
