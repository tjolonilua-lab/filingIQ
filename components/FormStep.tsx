import { ReactNode } from 'react'

interface FormStepProps {
  title: string
  description?: string
  children: ReactNode
}

export default function FormStep({ title, description, children }: FormStepProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-filingiq-blue mb-2">{title}</h2>
        {description && <p className="text-gray-600">{description}</p>}
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
        {children}
      </div>
    </div>
  )
}

