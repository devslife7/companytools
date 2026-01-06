import Link from "next/link"
import { Calculator, Home } from "lucide-react"

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition">
                <Home className="w-5 h-5" />
                <span className="font-semibold text-lg">Company Tools</span>
              </Link>
              
              <nav className="hidden md:flex space-x-6">
                <Link 
                  href="/batch-calculator" 
                  className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 transition"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Batch Calculator</span>
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-gray-500 text-sm">
        <p>Company Tools © {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}

