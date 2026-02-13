'use client'

interface FilingIQLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
  className?: string
}

export default function FilingIQLogo({ 
  size = 'md', 
  showTagline = false,
  className = '' 
}: FilingIQLogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        {/* Glowing document icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-filingiq-blue/20 blur-xl rounded-full"></div>
          <div className="relative flex items-center space-x-3">
            {/* Document stack icon */}
            <div className="relative">
              <svg
                width={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
                height={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
                viewBox="0 0 32 32"
                fill="none"
                className="text-filingiq-blue"
              >
                {/* Document stack */}
                <rect x="6" y="4" width="20" height="24" rx="2" fill="currentColor" opacity="0.9" />
                <rect x="6" y="8" width="20" height="24" rx="2" fill="currentColor" opacity="0.6" />
                <rect x="6" y="12" width="20" height="24" rx="2" fill="currentColor" opacity="0.3" />
                {/* Lines on document */}
                <line x1="10" y1="16" x2="22" y2="16" stroke="white" strokeWidth="1.5" />
                <line x1="10" y1="20" x2="18" y2="20" stroke="white" strokeWidth="1.5" />
                <line x1="10" y1="24" x2="20" y2="24" stroke="white" strokeWidth="1.5" />
              </svg>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-filingiq-blue/30 blur-md animate-pulse"></div>
            </div>
            <span className={`font-bold ${sizeClasses[size]} text-filingiq-blue tracking-tight`}>
              FilingIQ
            </span>
          </div>
        </div>
      </div>
      {showTagline && (
        <p className="text-sm text-gray-600 mt-2 font-medium">
          AI built for Tax Pros
        </p>
      )}
    </div>
  )
}

