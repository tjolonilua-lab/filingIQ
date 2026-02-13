'use client'

import HolographicPanel from '@/components/ui/HolographicPanel'

interface Strategy {
  title: string
  description: string
  potentialSavings?: string
  confidence: 'high' | 'medium' | 'low'
  category: string
}

interface AIInsightsPanelProps {
  strategies: Strategy[]
  isLoading?: boolean
}

export default function AIInsightsPanel({ strategies, isLoading }: AIInsightsPanelProps) {
  if (isLoading) {
    return (
      <HolographicPanel title="AI INSIGHTS" glowColor="cyan" className="h-full">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-filingiq-cyan mx-auto mb-4"></div>
            <p className="text-gray-400">Analyzing documents and identifying strategies...</p>
          </div>
        </div>
      </HolographicPanel>
    )
  }

  if (strategies.length === 0) {
    return (
      <HolographicPanel title="AI INSIGHTS" glowColor="cyan" className="h-full">
        <div className="text-center py-12 text-gray-400">
          <p>No strategies identified yet.</p>
          <p className="text-sm mt-2">Upload documents to discover tax optimization opportunities.</p>
        </div>
      </HolographicPanel>
    )
  }

  return (
    <HolographicPanel title="AI INSIGHTS" glowColor="cyan" className="h-full">
      <div className="space-y-4">
        {strategies.map((strategy, idx) => (
          <StrategyCard key={idx} strategy={strategy} />
        ))}
      </div>
    </HolographicPanel>
  )
}

function StrategyCard({ strategy }: { strategy: Strategy }) {
  const confidenceColors = {
    high: 'bg-green-500/20 text-green-400 border-green-500/50',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    low: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  }

  return (
    <div className="bg-filingiq-dark/50 border border-filingiq-cyan/30 rounded-lg p-4 hover:border-filingiq-cyan/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-filingiq-cyan font-semibold text-sm">{strategy.category}</span>
            <span className={`px-2 py-0.5 rounded text-xs border ${confidenceColors[strategy.confidence]}`}>
              {strategy.confidence.toUpperCase()}
            </span>
          </div>
          <h4 className="text-white font-semibold mb-1">{strategy.title}</h4>
          <p className="text-gray-300 text-sm">{strategy.description}</p>
        </div>
      </div>
      {strategy.potentialSavings && (
        <div className="mt-3 pt-3 border-t border-filingiq-cyan/20">
          <p className="text-filingiq-cyan text-sm font-medium">
            Potential Savings: {strategy.potentialSavings}
          </p>
        </div>
      )}
    </div>
  )
}

