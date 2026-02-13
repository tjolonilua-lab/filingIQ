import type { Metadata } from 'next'
import './globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AnalyticsProvider } from '@/components/AnalyticsProvider'

export function generateMetadata(): Metadata {
  return {
    title: `FilingIQ - ${process.env.BUSINESS_NAME || 'Tax Services'}`,
    description: `AI-powered tax strategy discovery. We don't just file forms—we identify top tax strategies tailored to your situation. Turn your documents into actionable strategies typically reserved for billionaires.`,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        <ErrorBoundary>
          <AnalyticsProvider>
            {children}
          </AnalyticsProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

