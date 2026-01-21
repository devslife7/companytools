"use client";

import { useState } from "react";
import { BookOpen, Calendar, Box, Settings, Plus, Search, Filter, Menu, X } from "lucide-react";

export default function TestPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const cocktails = [
    {
      name: "Smoked Maple Old Fashioned",
      label: "SIGNATURE",
      labelColor: "bg-orange-500",
      spirit: "BOURBON",
      glass: "ROCKS",
      image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=500&fit=crop"
    },
    {
      name: "Lavender Spritz",
      label: "SEASONAL",
      labelColor: "bg-orange-500",
      spirit: "GIN",
      glass: "SPARKLING",
      image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=500&fit=crop"
    },
    {
      name: "Classic Negroni",
      label: "CLASSIC",
      labelColor: "bg-gray-700",
      spirit: "GIN",
      glass: "UP",
      image: "https://images.unsplash.com/photo-1606921231510-ae0c5c0b0c0c?w=400&h=500&fit=crop&q=80"
    },
    {
      name: "Spiced Pear Fizz",
      label: "SEASONAL",
      labelColor: "bg-orange-500",
      spirit: "VODKA",
      glass: "FLUTE",
      image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=500&fit=crop"
    },
    {
      name: "Midnight Espresso Martini",
      label: "SIGNATURE",
      labelColor: "bg-orange-500",
      spirit: "VODKA",
      glass: "COUPE",
      image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=500&fit=crop"
    },
    {
      name: "Botanical Garden",
      label: "SIGNATURE",
      labelColor: "bg-orange-500",
      spirit: "GIN",
      glass: "HIGHBALL",
      image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=500&fit=crop"
    },
    {
      name: "Cucumber Lime Smash",
      label: "ZERO-PROOF",
      labelColor: "bg-green-500",
      spirit: "NON-ALC",
      glass: "HIGHBALL",
      image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=500&fit=crop"
    },
    {
      name: "Mezcal Paloma",
      label: "CLASSIC",
      labelColor: "bg-gray-700",
      spirit: "TEQUILA",
      glass: "ROCKS",
      image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=500&fit=crop"
    },
  ];

  return (
    <div className="min-h-screen bg-white flex">
      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo Section */}
        <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-t-lg border-b-0"></div>
            </div>
            <div>
              <div className="font-bold text-base lg:text-lg text-gray-900">Catering Co.</div>
              <div className="text-xs text-gray-500 font-normal">DRINK LIBRARY</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <a
                href="#"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-teal-50 text-teal-600 relative group"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 rounded-r"></div>
                <BookOpen className="w-5 h-5" />
                <span className="font-semibold">Library</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition"
              >
                <Calendar className="w-5 h-5" />
                <span>Events</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition"
              >
                <Box className="w-5 h-5" />
                <span>Inventory</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </a>
            </li>
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-teal-400 rounded-full flex items-center justify-center text-white font-semibold">
              MV
            </div>
            <div>
              <div className="font-semibold text-gray-900">Marcus V.</div>
              <div className="text-xs text-gray-500">Head Mixologist</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8">
        {/* Mobile Header with Menu Button */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <button className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg transition text-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Recipe</span>
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 lg:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Curated Gallery</h1>
            <p className="text-sm sm:text-base text-gray-500">Manage and batch seasonal beverage programs.</p>
          </div>
          <button className="hidden lg:flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition">
            <Plus className="w-5 h-5" />
            <span>New Recipe</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 lg:mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or ingredient..."
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 lg:pb-0">
            <select className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base whitespace-nowrap">
              <option>Spirit: Gin</option>
              <option>Spirit: Vodka</option>
              <option>Spirit: Bourbon</option>
              <option>Spirit: Tequila</option>
            </select>
            <select className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base whitespace-nowrap">
              <option>Style: All</option>
              <option>Style: Signature</option>
              <option>Style: Classic</option>
              <option>Style: Seasonal</option>
            </select>
            <select className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base whitespace-nowrap">
              <option>Glass: Coupe</option>
              <option>Glass: Rocks</option>
              <option>Glass: Highball</option>
              <option>Glass: Flute</option>
            </select>
            <button className="p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition flex-shrink-0">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Cocktail Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {cocktails.map((cocktail, index) => (
            <div
              key={index}
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="relative h-32 sm:h-40 lg:h-44 overflow-hidden">
                <img
                  src={cocktail.image}
                  alt={cocktail.name}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute top-1.5 sm:top-2 left-1.5 sm:left-2 px-1.5 py-0.5 ${cocktail.labelColor} text-white text-[10px] sm:text-xs font-semibold rounded`}>
                  {cocktail.label}
                </div>
              </div>
              <div className="p-2 sm:p-3">
                <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-0.5 line-clamp-2">{cocktail.name}</h3>
                <p className="text-[10px] sm:text-xs text-gray-500">
                  {cocktail.spirit} • {cocktail.glass}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
