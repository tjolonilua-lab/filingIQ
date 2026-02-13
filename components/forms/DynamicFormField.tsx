'use client'

import { FormField, FieldType } from '@/lib/form-config'
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form'

interface DynamicFormFieldProps {
  field: FormField
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  watch?: UseFormWatch<any>
  setValue?: UseFormSetValue<any>
  primaryColor: string
  files?: File[]
  onFilesChange?: (files: File[]) => void
}

export default function DynamicFormField({
  field,
  register,
  errors,
  watch,
  setValue,
  primaryColor,
  files,
  onFilesChange,
}: DynamicFormFieldProps) {
  const fieldError = errors[field.id]
  const fieldValue = watch ? watch(field.id) : undefined

  const inputClasses = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
  const focusStyle = {
    '--tw-ring-color': primaryColor,
  } as React.CSSProperties & { '--tw-ring-color': string }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = primaryColor
    e.target.style.boxShadow = `0 0 0 2px ${primaryColor}40`
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = ''
    e.target.style.boxShadow = ''
  }

  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
      return (
        <div>
          <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
            {field.label} {field.required && '*'}
          </label>
          <input
            id={field.id}
            type={field.type}
            {...register(field.id, {
              required: field.required ? `${field.label} is required` : false,
            })}
            placeholder={field.placeholder}
            className={inputClasses}
            style={focusStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {field.description && (
            <p className="text-xs text-gray-500 mt-1">{field.description}</p>
          )}
          {fieldError && (
            <p className="mt-1 text-sm text-red-600">{fieldError.message as string}</p>
          )}
        </div>
      )

    case 'textarea':
      return (
        <div>
          <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
            {field.label} {field.required && '*'}
          </label>
          <textarea
            id={field.id}
            {...register(field.id, {
              required: field.required ? `${field.label} is required` : false,
            })}
            placeholder={field.placeholder}
            rows={3}
            className={inputClasses}
            style={focusStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {field.description && (
            <p className="text-xs text-gray-500 mt-1">{field.description}</p>
          )}
          {fieldError && (
            <p className="mt-1 text-sm text-red-600">{fieldError.message as string}</p>
          )}
        </div>
      )

    case 'select':
      return (
        <div>
          <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
            {field.label} {field.required && '*'}
          </label>
          <select
            id={field.id}
            {...register(field.id, {
              required: field.required ? `${field.label} is required` : false,
            })}
            className={inputClasses}
            style={focusStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          >
            <option value="">Select {field.label.toLowerCase()}...</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {field.description && (
            <p className="text-xs text-gray-500 mt-1">{field.description}</p>
          )}
          {fieldError && (
            <p className="mt-1 text-sm text-red-600">{fieldError.message as string}</p>
          )}
        </div>
      )

    case 'checkbox':
      // For single checkbox (boolean)
      if (!field.options || field.options.length === 0) {
        return (
          <div>
            <label className="flex items-center space-x-3">
              <input
                id={field.id}
                type="checkbox"
                {...register(field.id)}
                className="w-4 h-4 border-gray-300 rounded"
                style={{ accentColor: primaryColor }}
              />
              <span className="text-sm font-medium text-gray-700">
                {field.label} {field.required && '*'}
              </span>
            </label>
            {field.description && (
              <p className="text-xs text-gray-500 mt-1 ml-7">{field.description}</p>
            )}
            {fieldError && (
              <p className="mt-1 text-sm text-red-600 ml-7">{fieldError.message as string}</p>
            )}
          </div>
        )
      }
      
      // For multiple checkboxes (array)
      const checkedValues = Array.isArray(fieldValue) ? fieldValue : []
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.label} {field.required && '*'}
          </label>
          <div className="space-y-2">
            {field.options.map((option) => {
              const isChecked = checkedValues.includes(option)
              return (
                <label key={option} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (!setValue) return
                      const current = checkedValues
                      const newValue = e.target.checked
                        ? [...current, option]
                        : current.filter((v) => v !== option)
                      setValue(field.id, newValue, { shouldValidate: true })
                    }}
                    className="w-4 h-4 border-gray-300 rounded"
                    style={{ accentColor: primaryColor }}
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              )
            })}
          </div>
          {field.description && (
            <p className="text-xs text-gray-500 mt-1">{field.description}</p>
          )}
          {fieldError && (
            <p className="mt-1 text-sm text-red-600">{fieldError.message as string}</p>
          )}
        </div>
      )

    case 'file':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label} {field.required && '*'}
          </label>
          {files !== undefined && onFilesChange ? (
            <div>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const newFiles = Array.from(e.target.files || [])
                  onFilesChange([...files, ...newFiles])
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              {files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.map((file, idx) => (
                    <div key={idx} className="text-sm text-gray-600 flex items-center justify-between">
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newFiles = files.filter((_, i) => i !== idx)
                          onFilesChange(newFiles)
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <input
              type="file"
              multiple
              {...register(field.id, {
                required: field.required ? `${field.label} is required` : false,
              })}
              className={inputClasses}
            />
          )}
          {field.description && (
            <p className="text-xs text-gray-500 mt-1">{field.description}</p>
          )}
          {fieldError && (
            <p className="mt-1 text-sm text-red-600">{fieldError.message as string}</p>
          )}
        </div>
      )

    default:
      return null
  }
}

