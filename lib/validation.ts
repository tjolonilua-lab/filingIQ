import { z } from 'zod'

// Step 1: Contact Info
export const contactInfoSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
})

// Step 2: Filing Info
export const filingInfoSchema = z.object({
  filingType: z.enum([
    'Individual',
    'Married Filing Jointly',
    'Married Filing Separately',
    'Head of Household',
    'Business (LLC/Sole Prop/S-Corp)',
  ]),
  isReturningClient: z.boolean(),
})

// Step 3: Income Types (base schema for merging)
export const incomeTypesSchemaBase = z.object({
  incomeTypes: z.array(z.string()).default([]),
  otherIncome: z.string().optional(),
})

// Step 3: Income Types (with validation)
export const incomeTypesSchema = incomeTypesSchemaBase.refine(
  (data) => {
    // Require at least one income type OR an "other" description
    return data.incomeTypes.length > 0 || (data.otherIncome && data.otherIncome.trim().length > 0)
  },
  {
    message: 'Please select at least one income type or describe other income',
    path: ['incomeTypes'], // This will show the error on the incomeTypes field
  }
)

// Document analysis schema
export const documentAnalysisSchema = z.object({
  documentType: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  extractedData: z.object({
    year: z.string().optional(),
    amounts: z.array(z.object({
      label: z.string(),
      value: z.number(),
      description: z.string().optional(),
    })).optional(),
    employer: z.string().optional(),
    payer: z.string().optional(),
    recipient: z.string().optional(),
    dates: z.array(z.object({
      label: z.string(),
      value: z.string(),
    })).optional(),
    other: z.record(z.union([z.string(), z.number()])).optional(),
  }),
  summary: z.string(),
  notes: z.array(z.string()).optional(),
})

// Full intake payload schema
export const intakeSchema = z.object({
  contactInfo: contactInfoSchema,
  filingInfo: filingInfoSchema,
  incomeInfo: incomeTypesSchema,
  documents: z.array(z.object({
    filename: z.string(),
    urlOrPath: z.string(),
    size: z.number(),
    type: z.string(),
    analysis: documentAnalysisSchema.nullable().optional(),
  })),
  submittedAt: z.string(),
})

// Type exports
export type ContactInfo = z.infer<typeof contactInfoSchema>
export type FilingInfo = z.infer<typeof filingInfoSchema>
export type IncomeTypes = z.infer<typeof incomeTypesSchema>
export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>
export type IntakeSubmission = z.infer<typeof intakeSchema>

