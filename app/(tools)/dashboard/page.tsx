"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { DollarSign, TrendingUp, Receipt, Percent, ArrowUpRight, ArrowDownRight, BarChart3 } from "lucide-react"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts"
import { computeDashboardData, type DashboardData, type EventFinancials } from "@/features/dashboard/lib/dashboard-calculations"

type SortKey = "name" | "eventDate" | "recipeCount" | "totalServings" | "revenue" | "ingredientCost" | "profit" | "margin"
type SortDir = "asc" | "desc"

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("eventDate")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  useEffect(() => {
    Promise.all([
      fetch("/api/events").then((r) => r.json()),
      fetch("/api/cocktails").then((r) => r.json()),
      fetch("/api/liquor-prices").then((r) => r.json()),
    ])
      .then(([eventsRes, cocktailsRes, pricesRes]) => {
        const events = eventsRes.events ?? []
        const cocktails = cocktailsRes.cocktails ?? cocktailsRes
        const dashboard = computeDashboardData(events, cocktails, pricesRes)
        setData(dashboard)
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err)
        setError("Failed to load dashboard data")
      })
      .finally(() => setLoading(false))
  }, [])

  const sortedEvents = useMemo(() => {
    if (!data) return []
    const sorted = [...data.events]
    sorted.sort((a, b) => {
      let cmp = 0
      if (sortKey === "name") cmp = a.name.localeCompare(b.name)
      else if (sortKey === "eventDate") cmp = new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      else cmp = (a[sortKey] as number) - (b[sortKey] as number)
      return sortDir === "asc" ? cmp : -cmp
    })
    return sorted
  }, [data, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading…
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 text-sm">
        {error}
      </div>
    )
  }

  if (!data || data.events.length === 0) {
    return (
      <div className="min-h-screen font-sans">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="p-4 rounded-2xl bg-gray-50 text-gray-200 mb-4">
              <BarChart3 className="w-7 h-7" />
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">No data yet</p>
            <p className="text-xs text-gray-400 max-w-xs mb-4">
              Save events from the batch calculator to see your financial dashboard.
            </p>
            <Link
              href="/batch-calculator"
              className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
            >
              Go to Batch Calculator
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { totals, topCocktails, monthlyTrend } = data

  return (
    <div className="min-h-screen font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">
            {totals.eventCount} {totals.eventCount === 1 ? "event" : "events"} · {totals.totalServings.toLocaleString()} total servings
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            label="Total Revenue"
            value={formatCurrency(totals.revenue)}
            sub={`${totals.eventCount} events`}
            icon={<DollarSign className="w-4 h-4" />}
            accent="text-green-600"
            bg="bg-green-50"
          />
          <KpiCard
            label="Ingredient Cost"
            value={formatCurrency(totals.cost)}
            sub={`${totals.totalServings.toLocaleString()} servings`}
            icon={<Receipt className="w-4 h-4" />}
            accent="text-red-500"
            bg="bg-red-50"
          />
          <KpiCard
            label="Total Profit"
            value={formatCurrency(totals.profit)}
            sub={totals.profit >= 0 ? "net positive" : "net negative"}
            icon={<TrendingUp className="w-4 h-4" />}
            accent="text-blue-600"
            bg="bg-blue-50"
          />
          <KpiCard
            label="Avg Margin"
            value={`${totals.margin.toFixed(1)}%`}
            sub="revenue − cost"
            icon={<Percent className="w-4 h-4" />}
            accent="text-purple-600"
            bg="bg-purple-50"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Revenue vs Cost by Event */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Revenue vs Cost by Event</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.events.map((e) => ({
                  name: e.name.length > 15 ? e.name.slice(0, 15) + "…" : e.name,
                  Revenue: round2(e.revenue),
                  Cost: round2(e.ingredientCost),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="Revenue" fill="#f54900" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Cost" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Monthly Trend</h2>
            <div className="h-64">
              {monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrend.map((m) => ({
                    ...m,
                    revenue: round2(m.revenue),
                    cost: round2(m.cost),
                    profit: round2(m.profit),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#f54900" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="cost" stroke="#9ca3af" strokeWidth={2} name="Cost" />
                    <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} name="Profit" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  Need multiple months of data for trends
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Events Financial Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Events Financial Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <SortableHeader label="Event" sortKey="name" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortableHeader label="Date" sortKey="eventDate" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortableHeader label="Recipes" sortKey="recipeCount" currentKey={sortKey} dir={sortDir} onSort={handleSort} align="right" />
                  <SortableHeader label="Servings" sortKey="totalServings" currentKey={sortKey} dir={sortDir} onSort={handleSort} align="right" />
                  <SortableHeader label="Revenue" sortKey="revenue" currentKey={sortKey} dir={sortDir} onSort={handleSort} align="right" />
                  <SortableHeader label="Cost" sortKey="ingredientCost" currentKey={sortKey} dir={sortDir} onSort={handleSort} align="right" />
                  <SortableHeader label="Profit" sortKey="profit" currentKey={sortKey} dir={sortDir} onSort={handleSort} align="right" />
                  <SortableHeader label="Margin" sortKey="margin" currentKey={sortKey} dir={sortDir} onSort={handleSort} align="right" />
                </tr>
              </thead>
              <tbody>
                {sortedEvents.map((e) => (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">
                      <Link
                        href={`/batch-calculator/review?recipes=${e.recipeIds.join(",")}`}
                        className="hover:text-orange-600 transition-colors"
                      >
                        {e.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(e.eventDate)}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{e.recipeCount}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{e.totalServings.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-gray-900 font-medium">{formatCurrency(e.revenue)}</td>
                    <td className="px-5 py-3 text-right text-gray-500">{formatCurrency(e.ingredientCost)}</td>
                    <td className="px-5 py-3 text-right font-medium">
                      <span className={e.profit >= 0 ? "text-green-600" : "text-red-500"}>
                        {formatCurrency(e.profit)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <MarginBadge margin={e.margin} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Cocktails */}
        {topCocktails.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Top Cocktails by Revenue</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Cocktail</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Times Used</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Total Servings</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topCocktails.map((c, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{c.eventCount}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{c.totalServings.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right text-gray-900 font-medium">{formatCurrency(c.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Helper Components ---

function KpiCard({ label, value, sub, icon, accent, bg }: {
  label: string; value: string; sub: string; icon: React.ReactNode; accent: string; bg: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        <div className={`p-1.5 rounded-lg ${bg} ${accent}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

function SortableHeader({ label, sortKey, currentKey, dir, onSort, align }: {
  label: string; sortKey: SortKey; currentKey: SortKey; dir: SortDir; onSort: (k: SortKey) => void; align?: string
}) {
  const active = sortKey === currentKey
  return (
    <th
      className={`px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 select-none ${align === "right" ? "text-right" : ""}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && (dir === "asc" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}
      </span>
    </th>
  )
}

function MarginBadge({ margin }: { margin: number }) {
  let color = "bg-red-50 text-red-600"
  if (margin >= 50) color = "bg-green-50 text-green-600"
  else if (margin >= 25) color = "bg-yellow-50 text-yellow-600"
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {margin.toFixed(1)}%
    </span>
  )
}

// --- Utilities ---

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
