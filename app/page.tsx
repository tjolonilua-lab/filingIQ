import Button from '@/components/Button'
import FilingIQLogo from '@/components/FilingIQLogo'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-filingiq-dark via-filingiq-dark to-blue-900">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <FilingIQLogo size="md" showTagline={false} />
          <div className="flex items-center space-x-4">
            <a href="/login" className="text-gray-300 hover:text-white transition-colors">
              Login
            </a>
            <Button href="/signup" variant="primary" className="px-6 py-2">
              Sign Up
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              AI-Powered Tax Strategy Discovery
              <br />
              <span className="text-filingiq-cyan">Built for Tax Pros</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Imagine your tax software not just filing forms but using AI to identify top tax strategies fitting each of your clients. 
              FilingIQ ingests tax documents from your clients and turns them into actionable strategies that typically have been reserved for billionaires.
            </p>
          </div>

          <div className="pt-6 space-x-4">
            <Button href="/signup" variant="primary" className="text-lg px-8 py-4">
              Get Started Free
            </Button>
            <Button href="/demo" variant="secondary" className="text-lg px-8 py-4">
              See Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-filingiq-dark/50 border border-filingiq-cyan/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="w-12 h-12 bg-filingiq-cyan/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-filingiq-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">AI Strategy Discovery</h3>
            <p className="text-gray-400">
              Automatically identify tax optimization strategies from client documents using advanced AI.
            </p>
          </div>

          <div className="bg-filingiq-dark/50 border border-filingiq-cyan/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="w-12 h-12 bg-filingiq-cyan/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-filingiq-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Secure Client Intake</h3>
            <p className="text-gray-400">
              White-label intake microsite with secure document upload and client management.
            </p>
          </div>

          <div className="bg-filingiq-dark/50 border border-filingiq-cyan/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="w-12 h-12 bg-filingiq-cyan/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-filingiq-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Actionable Insights</h3>
            <p className="text-gray-400">
              Get personalized strategy recommendations with potential savings calculations.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

