import { Sidebar } from "@/components/layout/sidebar"
import React from "react"

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar />
      <main className="flex-1 md:ml-56 w-full px-4 sm:px-6 lg:px-8 pt-20 md:pt-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

