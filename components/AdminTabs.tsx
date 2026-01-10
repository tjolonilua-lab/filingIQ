'use client'

interface AdminTabsProps {
  activeTab: 'settings' | 'clients'
  onTabChange: (tab: 'settings' | 'clients') => void
}

export default function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  return (
    <div className="border-b border-gray-200/60">
      <nav className="flex space-x-1" aria-label="Tabs">
        <button
          onClick={() => onTabChange('settings')}
          className={`
            relative px-4 py-3 text-sm font-medium transition-all duration-200
            ${
              activeTab === 'settings'
                ? 'text-filingiq-blue'
                : 'text-gray-500 hover:text-gray-700'
            }
          `}
        >
          Settings
          {activeTab === 'settings' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-filingiq-blue rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => onTabChange('clients')}
          className={`
            relative px-4 py-3 text-sm font-medium transition-all duration-200
            ${
              activeTab === 'clients'
                ? 'text-filingiq-blue'
                : 'text-gray-500 hover:text-gray-700'
            }
          `}
        >
          Clients
          {activeTab === 'clients' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-filingiq-blue rounded-t-full" />
          )}
        </button>
      </nav>
    </div>
  )
}

