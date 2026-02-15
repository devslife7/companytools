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
      <main className="flex-1 md:ml-64 w-full">
        {children}
      </main>
    </div>
  )
}

