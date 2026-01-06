import Link from "next/link"
import { Calculator, ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900">
            Welcome to <span className="text-orange-600">Company Tools</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional tools designed to streamline your workflow and boost productivity. 
            Simple, powerful, and tailored to our specifically needs here at Design Cuisine.
          </p>
          <div className="pt-4">
            <Link
              href="/batch-calculator"
              className="inline-flex items-center space-x-2 bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Available Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Link
              href="/batch-calculator"
              className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 p-8 border border-gray-200 hover:border-orange-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 rounded-lg bg-orange-100">
                  <Calculator className="w-8 h-8 text-orange-600" />
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-2 transition-all" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition mb-3">
                Batch Calculator
              </h3>
              <p className="text-gray-600">
                Calculate ingredient quantities for batch cocktail recipes with precise measurements, 
                unit conversions, and production sheets.
              </p>
            </Link>

            {/* Placeholder for future tools */}
            <div className="bg-gray-50 rounded-xl shadow-sm p-8 border border-dashed border-gray-300">
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-center">
                  More tools<br />coming soon
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl shadow-sm p-8 border border-dashed border-gray-300">
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-center">
                  More tools<br />coming soon
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Why Company Tools?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Fast & Efficient</h3>
              <p className="text-gray-600">
                Built for speed with modern web technologies
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Purpose-Built</h3>
              <p className="text-gray-600">
                Each tool designed for our specific professional needs here at Design Cuisine.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Reliable</h3>
              <p className="text-gray-600">
                Industry-standard practices and calculations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-24 py-8 border-t border-gray-200 text-center text-gray-500">
        <p>Company Tools © {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
