'use client'

import { useState, useEffect } from 'react'
import { FormConfiguration, FormStep, FormField, FieldType, defaultFormConfig, validateFormConfig } from '@/lib/form-config'
import { useToast } from '@/components/ui/Toast'

interface FormBuilderProps {
  accountId: string | null
}

export default function FormBuilder({ accountId }: FormBuilderProps) {
  const { showToast } = useToast()
  const [config, setConfig] = useState<FormConfiguration>(defaultFormConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null)
  const [editingField, setEditingField] = useState<{ stepIndex: number; fieldIndex: number } | null>(null)
  const [useCustomForm, setUseCustomForm] = useState(false)

  // Load form configuration
  useEffect(() => {
    if (!accountId) return
    
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/account/form-config', {
          headers: {
            'X-Account-Id': accountId,
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.config) {
            // Check if this is a custom config (not the default)
            const isDefault = JSON.stringify(data.config) === JSON.stringify(defaultFormConfig)
            setHasCustomConfig(!isDefault)
            setUseCustomForm(!isDefault)
            setConfig(data.config)
          }
        }
      } catch (error) {
        console.error('Error loading form config:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadConfig()
  }, [accountId])

  const handleSave = async () => {
    if (!accountId) return
    
    // If using default, save null to clear custom config
    if (!useCustomForm) {
      setSaving(true)
      try {
        // Reset to default by sending null
        const response = await fetch('/api/account/form-config', {
          method: 'PUT',
          headers: {
            'X-Account-Id': accountId,
          },
        })
        
        const data = await response.json()
        if (data.success) {
          setConfig(defaultFormConfig)
          setHasCustomConfig(false)
          showToast('Using default form configuration', 'success')
        } else {
          throw new Error(data.error || 'Failed to save')
        }
      } catch (error) {
        console.error('Error saving form config:', error)
        showToast(error instanceof Error ? error.message : 'Failed to save form configuration', 'error')
      } finally {
        setSaving(false)
      }
      return
    }
    
    // Validate configuration
    const validation = validateFormConfig(config)
    if (!validation.valid) {
      showToast(`Invalid configuration: ${validation.errors[0]}`, 'error')
      return
    }
    
    setSaving(true)
    try {
      const response = await fetch('/api/account/form-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Account-Id': accountId,
        },
        body: JSON.stringify({ config }),
      })
      
      const data = await response.json()
      if (data.success) {
        setHasCustomConfig(true)
        showToast('Custom form configuration saved successfully!', 'success')
      } else {
        throw new Error(data.error || 'Failed to save')
      }
    } catch (error) {
      console.error('Error saving form config:', error)
      showToast(error instanceof Error ? error.message : 'Failed to save form configuration', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!accountId) return
    if (!confirm('Are you sure you want to reset to the default form? This cannot be undone.')) {
      return
    }
    
    setSaving(true)
    try {
      const response = await fetch('/api/account/form-config', {
        method: 'PUT',
        headers: {
          'X-Account-Id': accountId,
        },
      })
      
      const data = await response.json()
      if (data.success && data.config) {
        setConfig(data.config)
        showToast('Form reset to default configuration', 'success')
      } else {
        throw new Error(data.error || 'Failed to reset')
      }
    } catch (error) {
      console.error('Error resetting form config:', error)
      showToast(error instanceof Error ? error.message : 'Failed to reset form configuration', 'error')
    } finally {
      setSaving(false)
    }
  }

  const updateStep = (stepIndex: number, updates: Partial<FormStep>) => {
    const newConfig = { ...config }
    newConfig.steps[stepIndex] = { ...newConfig.steps[stepIndex], ...updates }
    setConfig(newConfig)
  }

  const addStep = () => {
    const newStep: FormStep = {
      id: `step-${Date.now()}`,
      title: 'New Step',
      description: '',
      order: config.steps.length + 1,
      fields: [],
    }
    setConfig({ ...config, steps: [...config.steps, newStep] })
    setActiveStepIndex(config.steps.length)
  }

  const removeStep = (stepIndex: number) => {
    if (config.steps.length <= 1) {
      showToast('You must have at least one step', 'error')
      return
    }
    const newSteps = config.steps.filter((_, i) => i !== stepIndex)
    // Reorder steps
    newSteps.forEach((step, i) => {
      step.order = i + 1
    })
    setConfig({ ...config, steps: newSteps })
    if (activeStepIndex === stepIndex) {
      setActiveStepIndex(null)
    }
  }

  const addField = (stepIndex: number) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false,
      order: config.steps[stepIndex].fields.length + 1,
    }
    const newConfig = { ...config }
    newConfig.steps[stepIndex].fields.push(newField)
    setConfig(newConfig)
    setEditingField({ stepIndex, fieldIndex: newConfig.steps[stepIndex].fields.length - 1 })
  }

  const updateField = (stepIndex: number, fieldIndex: number, updates: Partial<FormField>) => {
    const newConfig = { ...config }
    newConfig.steps[stepIndex].fields[fieldIndex] = {
      ...newConfig.steps[stepIndex].fields[fieldIndex],
      ...updates,
    }
    setConfig(newConfig)
  }

  const removeField = (stepIndex: number, fieldIndex: number) => {
    const newConfig = { ...config }
    newConfig.steps[stepIndex].fields = newConfig.steps[stepIndex].fields.filter((_, i) => i !== fieldIndex)
    // Reorder fields
    newConfig.steps[stepIndex].fields.forEach((field, i) => {
      field.order = i + 1
    })
    setConfig(newConfig)
    if (editingField?.stepIndex === stepIndex && editingField?.fieldIndex === fieldIndex) {
      setEditingField(null)
    }
  }

  const moveStep = (stepIndex: number, direction: 'up' | 'down') => {
    const newSteps = [...config.steps]
    const targetIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1
    if (targetIndex < 0 || targetIndex >= newSteps.length) return
    
    [newSteps[stepIndex], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[stepIndex]]
    newSteps.forEach((step, i) => {
      step.order = i + 1
    })
    setConfig({ ...config, steps: newSteps })
    setActiveStepIndex(targetIndex)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-filingiq-blue"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Form Builder</h2>
            <p className="text-sm text-gray-600 mt-1">
              Customize the questionnaire your clients will see
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              disabled={saving || !useCustomForm}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Reset to Default
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-filingiq-blue hover:bg-blue-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {saving ? 'Saving...' : 'Save Form'}
            </button>
          </div>
        </div>
        
        {/* Toggle between Default and Custom */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Form Configuration
              </label>
              <p className="text-xs text-gray-500">
                {useCustomForm 
                  ? 'Using custom form configuration' 
                  : 'Using default form (short, optimized for quick intake)'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-sm ${!useCustomForm ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                Default
              </span>
              <button
                type="button"
                onClick={() => setUseCustomForm(!useCustomForm)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-filingiq-blue focus:ring-offset-2 ${
                  useCustomForm ? 'bg-filingiq-blue' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    useCustomForm ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-sm ${useCustomForm ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                Custom
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Steps List - Only show when using custom form */}
      {useCustomForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-gray-900">Form Steps</h3>
            <button
              onClick={addStep}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              + Add Step
            </button>
          </div>
        
        <div className="space-y-3">
          {config.steps.map((step, stepIndex) => (
            <div
              key={step.id}
              className={`border rounded-lg p-4 transition-all ${
                activeStepIndex === stepIndex
                  ? 'border-filingiq-blue bg-blue-50/50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-medium text-gray-500">Step {step.order}</span>
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => updateStep(stepIndex, { title: e.target.value })}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-filingiq-blue/50 focus:border-filingiq-blue text-sm font-semibold"
                      placeholder="Step Title"
                    />
                  </div>
                  <textarea
                    value={step.description}
                    onChange={(e) => updateStep(stepIndex, { description: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-filingiq-blue/50 focus:border-filingiq-blue text-sm mb-3"
                    placeholder="Step description (optional)"
                    rows={2}
                  />
                  <div className="text-xs text-gray-500 mb-2">
                    {step.fields.length} field{step.fields.length !== 1 ? 's' : ''}
                  </div>
                  
                  {/* Fields in this step */}
                  <div className="space-y-2 mt-3">
                    {step.fields.map((field, fieldIndex) => (
                      <div
                        key={field.id}
                        className="flex items-center space-x-2 p-2 bg-gray-50 rounded border border-gray-200"
                      >
                        <span className="text-xs text-gray-500 w-20 truncate">{field.type}</span>
                        <span className="flex-1 text-sm text-gray-700">{field.label}</span>
                        {field.required && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Required</span>
                        )}
                        <button
                          onClick={() => setEditingField({ stepIndex, fieldIndex })}
                          className="text-xs text-filingiq-blue hover:text-blue-600 px-2 py-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeField(stepIndex, fieldIndex)}
                          className="text-xs text-red-600 hover:text-red-700 px-2 py-1"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addField(stepIndex)}
                      className="text-xs text-filingiq-blue hover:text-blue-600 px-2 py-1 border border-dashed border-gray-300 rounded w-full"
                    >
                      + Add Field
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1 ml-4">
                  <button
                    onClick={() => moveStep(stepIndex, 'up')}
                    disabled={stepIndex === 0}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveStep(stepIndex, 'down')}
                    disabled={stepIndex === config.steps.length - 1}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeStep(stepIndex)}
                    className="px-2 py-1 text-xs text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Default Form Preview */}
      {!useCustomForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Default Form Preview</h3>
          <div className="space-y-4">
            {defaultFormConfig.steps.map((step) => (
              <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-500">Step {step.order}</span>
                  <span className="text-sm font-semibold text-gray-900">{step.title}</span>
                </div>
                <p className="text-xs text-gray-600 mb-3">{step.description}</p>
                <div className="text-xs text-gray-500">
                  {step.fields.length} field{step.fields.length !== 1 ? 's' : ''}: {step.fields.map(f => f.label).join(', ')}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50/80 border border-blue-200/60 rounded-lg">
            <p className="text-xs text-blue-800 leading-relaxed">
              <strong className="font-semibold">Default Form:</strong> This is a short, optimized intake form designed for quick client onboarding. 
              Toggle to "Custom" above to create your own custom questionnaire.
            </p>
          </div>
        </div>
      )}

      {/* Field Editor Modal */}
      {editingField && (
        <FieldEditor
          field={config.steps[editingField.stepIndex].fields[editingField.fieldIndex]}
          onUpdate={(updates) => {
            updateField(editingField.stepIndex, editingField.fieldIndex, updates)
          }}
          onClose={() => setEditingField(null)}
        />
      )}
    </div>
  )
}

interface FieldEditorProps {
  field: FormField
  onUpdate: (updates: Partial<FormField>) => void
  onClose: () => void
}

function FieldEditor({ field, onUpdate, onClose }: FieldEditorProps) {
  const fieldTypes: FieldType[] = ['text', 'email', 'tel', 'select', 'checkbox', 'textarea', 'file']
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Edit Field</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Type
              </label>
              <select
                value={field.type}
                onChange={(e) => onUpdate({ type: e.target.value as FieldType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-filingiq-blue/50 focus:border-filingiq-blue"
              >
                {fieldTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label *
              </label>
              <input
                type="text"
                value={field.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-filingiq-blue/50 focus:border-filingiq-blue"
                placeholder="Field Label"
              />
            </div>
            
            {(field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'textarea') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placeholder
                </label>
                <input
                  type="text"
                  value={field.placeholder || ''}
                  onChange={(e) => onUpdate({ placeholder: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-filingiq-blue/50 focus:border-filingiq-blue"
                  placeholder="Placeholder text"
                />
              </div>
            )}
            
            {(field.type === 'select' || field.type === 'checkbox') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Options (one per line) *
                </label>
                <textarea
                  value={field.options?.join('\n') || ''}
                  onChange={(e) => {
                    const options = e.target.value.split('\n').filter(o => o.trim())
                    onUpdate({ options })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-filingiq-blue/50 focus:border-filingiq-blue"
                  rows={5}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                />
                <p className="text-xs text-gray-500 mt-1">Enter one option per line</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Help Text)
              </label>
              <input
                type="text"
                value={field.description || ''}
                onChange={(e) => onUpdate({ description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-filingiq-blue/50 focus:border-filingiq-blue"
                placeholder="Optional help text for this field"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="required"
                checked={field.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="w-4 h-4 border-gray-300 rounded"
              />
              <label htmlFor="required" className="text-sm font-medium text-gray-700">
                Required Field
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

