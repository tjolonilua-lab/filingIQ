'use client'

import HolographicPanel from './HolographicPanel'

interface Metric {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  change?: string
}

interface MetricsPanelProps {
  metrics: Metric[]
  chartData?: Array<{ label: string; value: number }>
  isLoading?: boolean
}

export default function MetricsPanel({ metrics, chartData, isLoading }: MetricsPanelProps) {
  if (isLoading) {
    return (
      <HolographicPanel title="METRICS" glowColor="blue" className="h-full">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-filingiq-blue mx-auto"></div>
        </div>
      </HolographicPanel>
    )
  }

  return (
    <HolographicPanel title="METRICS" glowColor="blue" className="h-full">
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric, idx) => (
            <MetricCard key={idx} metric={metric} />
          ))}
        </div>

        {/* Chart */}
        {chartData && chartData.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-filingiq-blue mb-3">Tax Savings Potential</h4>
            <div className="h-48 flex items-end justify-between gap-2">
              {chartData.map((point, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-filingiq-blue/60 to-filingiq-cyan/60 rounded-t transition-all hover:from-filingiq-blue/80 hover:to-filingiq-cyan/80"
                    style={{ height: `${(point.value / Math.max(...chartData.map(d => d.value))) * 100}%` }}
                  />
                  <span className="text-xs text-gray-400 mt-2">{point.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </HolographicPanel>
  )
}

function MetricCard({ metric }: { metric: Metric }) {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400',
  }

  return (
    <div className="bg-filingiq-dark/50 border border-filingiq-blue/30 rounded-lg p-3">
      <p className="text-xs text-gray-400 mb-1">{metric.label}</p>
      <p className="text-xl font-bold text-white">{metric.value}</p>
      {metric.change && (
        <p className={`text-xs mt-1 ${trendColors[metric.trend || 'neutral']}`}>
          {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'} {metric.change}
        </p>
      )}
    </div>
  )
}

