import { Button, FilingIQLogo, HolographicPanel } from '@/components'

export default function DemoPage() {
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

      {/* Demo Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            See FilingIQ in Action
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Watch how FilingIQ transforms tax document intake into actionable AI-powered strategy recommendations
          </p>
        </div>

        {/* Video Container */}
        <div className="mb-12">
          <HolographicPanel glowColor="cyan" className="p-0 overflow-hidden">
            <div className="aspect-video bg-black">
              {/* Replace YOUTUBE_VIDEO_ID with your actual YouTube video ID */}
              {/* To get the ID: https://www.youtube.com/watch?v=YOUTUBE_VIDEO_ID */}
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/YOUTUBE_VIDEO_ID"
                title="FilingIQ Demo Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </HolographicPanel>
        </div>

        {/* What You'll See Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <HolographicPanel glowColor="blue" className="p-6">
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
              <svg className="w-6 h-6 text-filingiq-blue mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Client Intake Flow
            </h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• Multi-step branded intake form</li>
              <li>• Secure document upload</li>
              <li>• Real-time form validation</li>
              <li>• Customizable branding per tax firm</li>
            </ul>
          </HolographicPanel>

          <HolographicPanel glowColor="cyan" className="p-6">
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
              <svg className="w-6 h-6 text-filingiq-cyan mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Document Analysis
            </h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• Automatic document type detection</li>
              <li>• Key information extraction (W-2, 1099s)</li>
              <li>• Confidence scoring</li>
              <li>• Intelligent data parsing</li>
            </ul>
          </HolographicPanel>

          <HolographicPanel glowColor="blue" className="p-6">
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
              <svg className="w-6 h-6 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Strategy Recommendations
            </h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• Personalized tax strategies</li>
              <li>• Potential savings calculations</li>
              <li>• Actionable insights</li>
              <li>• Client-specific recommendations</li>
            </ul>
          </HolographicPanel>

          <HolographicPanel glowColor="cyan" className="p-6">
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
              <svg className="w-6 h-6 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Admin Dashboard
            </h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• View all client submissions</li>
              <li>• Detailed analysis results</li>
              <li>• Document management</li>
              <li>• Export capabilities</li>
            </ul>
          </HolographicPanel>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <HolographicPanel glowColor="cyan" className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to Transform Your Tax Practice?
            </h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Start using AI-powered tax strategy discovery for your clients today. 
              Set up your white-label intake portal in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/signup" variant="primary" className="text-lg px-8 py-4">
                Get Started Free
              </Button>
              <Button href="/" variant="secondary" className="text-lg px-8 py-4">
                Learn More
              </Button>
            </div>
          </HolographicPanel>
        </div>
      </div>
    </main>
  )
}
