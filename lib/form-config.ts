// Form configuration types for customizable intake forms

export type FieldType = 'text' | 'email' | 'tel' | 'select' | 'checkbox' | 'textarea' | 'file'

export interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required: boolean
  options?: string[] // For select and checkbox fields
  description?: string // Help text for the field
  order: number
}

export interface FormStep {
  id: string
  title: string
  description: string
  order: number
  fields: FormField[]
}

export interface FormConfiguration {
  steps: FormStep[]
  version: number // For future migrations
}

// Default form configuration (matches current hardcoded form)
export const defaultFormConfig: FormConfiguration = {
  version: 1,
  steps: [
    {
      id: 'contact',
      title: 'Contact Information',
      description: "We'll use this to deliver your personalized tax strategy recommendations.",
      order: 1,
      fields: [
        {
          id: 'fullName',
          type: 'text',
          label: 'Full Name',
          placeholder: 'John Doe',
          required: true,
          order: 1,
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          placeholder: 'john@example.com',
          required: true,
          order: 2,
        },
        {
          id: 'phone',
          type: 'tel',
          label: 'Phone',
          placeholder: '(555) 123-4567',
          required: true,
          order: 3,
        },
      ],
    },
    {
      id: 'filing',
      title: 'Filing Information',
      description: 'Tell us about your tax filing situation.',
      order: 2,
      fields: [
        {
          id: 'filingType',
          type: 'select',
          label: 'Filing Type',
          required: true,
          options: [
            'Individual',
            'Married Filing Jointly',
            'Married Filing Separately',
            'Head of Household',
            'Business (LLC/Sole Prop/S-Corp)',
          ],
          order: 1,
        },
        {
          id: 'isReturningClient',
          type: 'checkbox',
          label: 'I am a returning client',
          required: false,
          order: 2,
        },
      ],
    },
    {
      id: 'income',
      title: 'Income Types',
      description: 'Select all that apply to your situation.',
      order: 3,
      fields: [
        {
          id: 'incomeTypes',
          type: 'checkbox',
          label: 'Income Sources',
          required: true,
          options: [
            'W-2',
            '1099-NEC',
            '1099-K',
            'Investments / capital gains',
            'Rental income',
            'Self-employment income',
          ],
          order: 1,
        },
        {
          id: 'otherIncome',
          type: 'textarea',
          label: 'Other Income (optional)',
          placeholder: 'Describe any other income sources...',
          required: false,
          order: 2,
        },
      ],
    },
    {
      id: 'documents',
      title: 'Upload Your Tax Documents',
      description: 'Upload your tax documents (W-2s, 1099s, receipts, etc.). Our AI will analyze them to identify personalized tax strategies.',
      order: 4,
      fields: [
        {
          id: 'files',
          type: 'file',
          label: 'Tax Documents',
          required: true,
          description: 'Upload PDFs, images, or other tax-related documents',
          order: 1,
        },
      ],
    },
  ],
}

// Validate form configuration
export function validateFormConfig(config: FormConfiguration): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.steps || config.steps.length === 0) {
    errors.push('Form must have at least one step')
  }

  config.steps.forEach((step, stepIndex) => {
    if (!step.id) {
      errors.push(`Step ${stepIndex + 1} is missing an ID`)
    }
    if (!step.title) {
      errors.push(`Step ${stepIndex + 1} is missing a title`)
    }
    if (!step.fields || step.fields.length === 0) {
      errors.push(`Step "${step.title}" must have at least one field`)
    }

    step.fields.forEach((field, fieldIndex) => {
      if (!field.id) {
        errors.push(`Step "${step.title}", field ${fieldIndex + 1} is missing an ID`)
      }
      if (!field.label) {
        errors.push(`Step "${step.title}", field ${fieldIndex + 1} is missing a label`)
      }
      if ((field.type === 'select' || field.type === 'checkbox') && (!field.options || field.options.length === 0)) {
        errors.push(`Step "${step.title}", field "${field.label}" (${field.type}) must have options`)
      }
    })
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

