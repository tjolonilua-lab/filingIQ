import Link from 'next/link'
import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  href?: string
  children: ReactNode
}

export default function Button({ variant = 'primary', href, children, className = '', ...props }: ButtonProps) {
  const baseStyles = 'px-6 py-3 rounded-lg font-semibold transition-colors duration-200 text-center'
  const variants = {
    primary: 'bg-filingiq-blue hover:bg-blue-600 text-white shadow-lg shadow-blue-500/50',
    secondary: 'bg-filingiq-dark hover:bg-gray-800 text-white',
  }

  const combinedClassName = `${baseStyles} ${variants[variant]} ${className}`

  if (href) {
    return (
      <Link href={href} className={combinedClassName}>
        {children}
      </Link>
    )
  }

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  )
}

