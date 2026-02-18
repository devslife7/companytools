import { Sidebar } from "@/components/layout/sidebar"
import React from "react"

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Sidebar />
      <main className="md:ml-56 px-4 sm:px-6 lg:px-8 pt-20 md:pt-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

