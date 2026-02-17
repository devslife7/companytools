"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    GlassWater,
    Library,
    CalendarDays,
    User,
    Menu,
    X
} from "lucide-react"

const navItems = [
    { name: "Gallery", href: "/batch-calculator", icon: Library },
    { name: "Saved Events", href: "/saved-events", icon: CalendarDays },
]

function SidebarContent({ pathname, onNavClick }: { pathname: string; onNavClick?: () => void }) {
    return (
        <>
            {/* Logo Area */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                        <GlassWater className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 leading-tight">InternalToolsDC</h1>
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
                            onClick={onNavClick}
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
                        <User className="w-6 h-6 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">Marcos V.</p>
                        <p className="text-xs text-gray-500 truncate">Admin</p>
                    </div>
                </div>
            </div>
        </>
    )
}

export function Sidebar() {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)

    // Close drawer on route change
    useEffect(() => {
        setMobileOpen(false)
    }, [pathname])

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => { document.body.style.overflow = "" }
    }, [mobileOpen])

    return (
        <>
            {/* Mobile Top Bar */}
            <div className="fixed top-0 left-0 right-0 z-40 flex md:hidden items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white">
                        <GlassWater className="w-4.5 h-4.5" />
                    </div>
                    <span className="font-bold text-gray-900 text-sm">InternalToolsDC</span>
                </div>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-2 -mr-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Open menu"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Mobile Drawer Backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Drawer */}
            <aside
                className={`fixed top-0 left-0 z-50 h-screen w-72 bg-white border-r border-gray-200 flex flex-col md:hidden transform transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Close button */}
                <button
                    onClick={() => setMobileOpen(false)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
                    aria-label="Close menu"
                >
                    <X className="w-5 h-5" />
                </button>
                <SidebarContent pathname={pathname} onNavClick={() => setMobileOpen(false)} />
            </aside>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 z-40">
                <SidebarContent pathname={pathname} />
            </aside>
        </>
    )
}
