import Link from "next/link"
import { Calculator, ArrowRight } from "lucide-react"

export default function ToolsDashboard() {
  const tools = [
    {
      name: "Batch Calculator",
      description: "Calculate ingredient quantities for batch cocktail recipes with precise measurements and conversions.",
      href: "/batch-calculator",
      icon: Calculator,
      color: "orange",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome to <span className="text-orange-600">Company Tools</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Professional tools designed to streamline your workflow and boost productivity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <Link
              key={tool.name}
              href={tool.href}
              className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 hover:border-orange-300"
            >
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg bg-${tool.color}-100`}>
                  <Icon className={`w-6 h-6 text-${tool.color}-600`} />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
              </div>
              
              <h3 className="mt-4 text-xl font-semibold text-gray-900 group-hover:text-orange-600 transition">
                {tool.name}
              </h3>
              <p className="mt-2 text-gray-600 text-sm">
                {tool.description}
              </p>
            </Link>
          )
        })}
      </div>

      <div className="mt-16 text-center">
        <div className="inline-block bg-orange-50 rounded-lg px-6 py-4 border border-orange-200">
          <p className="text-gray-700">
            More tools coming soon! Check back regularly for updates.
          </p>
        </div>
      </div>
    </div>
  )
}

