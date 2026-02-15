"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    GlassWater,
    Library,
    CalendarDays,
    Package,
    Settings,
    User
} from "lucide-react"

export function Sidebar() {
    const pathname = usePathname()

    const navItems = [
        { name: "Gallery", href: "/batch-calculator", icon: Library },
        { name: "Events", href: "/events", icon: CalendarDays },
        { name: "Inventory", href: "/inventory", icon: Package },
        { name: "Settings", href: "/settings", icon: Settings },
    ]

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 z-40">
            {/* Logo Area */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                        <GlassWater className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 leading-tight">Catering Co.</h1>
                        <p className="text-xs text-gray-500 font-medium">DRINK LIBRARY</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive
                                ? "bg-orange-50 text-orange-700"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? "text-orange-600" : "text-gray-400"}`} />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {/* Placeholder Avatar */}
                        <User className="w-6 h-6 text-gray-500" />
                        {/* <img src="/avatar-placeholder.jpg" alt="User" /> if available */}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">Marcus V.</p>
                        <p className="text-xs text-gray-500 truncate">Head Mixologist</p>
                    </div>
                </div>
            </div>
        </aside>
    )
}
