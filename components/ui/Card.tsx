'use client'

import { forwardRef, HTMLAttributes } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
  hoverable?: boolean
  selected?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      elevated = false,
      hoverable = false,
      selected = false,
      padding = 'md',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={[
          'rounded-sm border transition-all duration-200',
          elevated ? 'bg-surface-elevated' : 'bg-surface',
          selected
            ? 'border-gold/50 shadow-[0_0_0_1px_rgba(201,169,110,0.12),0_1px_0_rgba(255,255,255,0.05)_inset,0_8px_24px_rgba(0,0,0,0.5)]'
            : 'border-border shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_4px_16px_rgba(0,0,0,0.3)]',
          hoverable
            ? 'hover:border-gold/20 hover:bg-surface-elevated hover:shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_8px_24px_rgba(0,0,0,0.45)] cursor-pointer'
            : '',
          paddings[padding],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Animated card variant
interface MotionCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  elevated?: boolean
  selected?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  delay?: number
}

export function AnimatedCard({
  elevated = false,
  selected = false,
  padding = 'md',
  delay = 0,
  className = '',
  children,
  ...props
}: MotionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={[
        'rounded-sm border transition-colors duration-200',
        elevated ? 'bg-surface-elevated' : 'bg-surface',
        selected
          ? 'border-gold/50 shadow-[0_0_0_1px_rgba(201,169,110,0.12),0_1px_0_rgba(255,255,255,0.05)_inset,0_8px_24px_rgba(0,0,0,0.5)]'
          : 'border-border shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_4px_16px_rgba(0,0,0,0.3)]',
        paddings[padding],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </motion.div>
  )
}
