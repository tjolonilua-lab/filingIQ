'use client'

import { ReactNode } from 'react'

interface HolographicPanelProps {
  children: ReactNode
  className?: string
  title?: string
  glowColor?: 'cyan' | 'blue'
}

export default function HolographicPanel({ 
  children, 
  className = '',
  title,
  glowColor = 'cyan'
}: HolographicPanelProps) {
  const glowClass = glowColor === 'cyan' ? 'shadow-glow-cyan' : 'shadow-glow-blue'
  const borderColor = glowColor === 'cyan' ? 'border-filingiq-cyan/50' : 'border-filingiq-blue/50'

  return (
    <div 
      className={`
        relative
        bg-gradient-to-br from-filingiq-dark/90 to-filingiq-dark/70
        backdrop-blur-md
        border ${borderColor}
        rounded-xl
        p-6
        ${glowClass}
        ${className}
      `}
      style={{
        boxShadow: glowColor === 'cyan' 
          ? '0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(0, 212, 255, 0.2), inset 0 0 20px rgba(0, 212, 255, 0.1)'
          : '0 0 20px rgba(0, 163, 255, 0.3), 0 0 40px rgba(0, 163, 255, 0.2), inset 0 0 20px rgba(0, 163, 255, 0.1)'
      }}
    >
      {/* Subtle inner glow */}
      <div 
        className="absolute inset-0 rounded-xl opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${
            glowColor === 'cyan' ? 'rgba(0, 212, 255, 0.3)' : 'rgba(0, 163, 255, 0.3)'
          }, transparent 70%)`
        }}
      />
      
      {title && (
        <h3 className="text-lg font-semibold text-filingiq-cyan mb-4 relative z-10">
          {title}
        </h3>
      )}
      
      <div className="relative z-10 text-gray-100">
        {children}
      </div>
    </div>
  )
}

