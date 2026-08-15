import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: boolean
}

/** Base surface container used across the app. */
export function Card({ children, padding = true, className = '', ...rest }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface shadow-card ${padding ? 'p-5 sm:p-6' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
