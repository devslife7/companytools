import type { CocktailRecipe, BatchState } from "@/features/batch-calculator/types"
import { FIXED_BATCH_LITERS } from "@/features/batch-calculator/lib/calculations"
import { calculateGrandTotals, type LiquorPriceMap } from "@/features/batch-calculator/lib/grand-totals"

interface EventRecipe {
  cocktailId: number
  cocktailName: string
  servings: number
}

interface SavedEventData {
  id: number
  name: string
  eventDate: string
  recipes: EventRecipe[]
  createdAt: string
}

export interface EventFinancials {
  id: number
  name: string
  eventDate: string
  totalServings: number
  revenue: number
  ingredientCost: number
  profit: number
  margin: number
  recipeCount: number
  recipeIds: number[]
}

export interface DashboardData {
  events: EventFinancials[]
  totals: {
    revenue: number
    cost: number
    profit: number
    margin: number
    eventCount: number
    totalServings: number
  }
  topCocktails: { name: string; totalServings: number; revenue: number; eventCount: number }[]
  monthlyTrend: { month: string; revenue: number; cost: number; profit: number }[]
}

export function computeDashboardData(
  events: SavedEventData[],
  cocktails: CocktailRecipe[],
  priceMap: LiquorPriceMap
): DashboardData {
  const cocktailMap: Record<number, CocktailRecipe> = {}
  for (const c of cocktails) {
    if (c.id != null) cocktailMap[c.id] = c
  }

  const cocktailStats: Record<number, { name: string; totalServings: number; revenue: number; eventCount: number }> = {}

  const eventFinancials: EventFinancials[] = events.map((event) => {
    const batches: BatchState[] = []
    let revenue = 0
    let totalServings = 0

    for (const recipe of event.recipes) {
      const cocktail = cocktailMap[recipe.cocktailId]
      if (!cocktail) continue

      const servings = recipe.servings
      totalServings += servings
      revenue += (cocktail.menuPrice ?? 0) * servings

      batches.push({
        id: recipe.cocktailId,
        selectedCocktail: cocktail,
        editableRecipe: cocktail,
        servings,
        targetLiters: FIXED_BATCH_LITERS,
      })

      // Track per-cocktail stats
      if (!cocktailStats[recipe.cocktailId]) {
        cocktailStats[recipe.cocktailId] = {
          name: cocktail.name,
          totalServings: 0,
          revenue: 0,
          eventCount: 0,
        }
      }
      cocktailStats[recipe.cocktailId].totalServings += servings
      cocktailStats[recipe.cocktailId].revenue += (cocktail.menuPrice ?? 0) * servings
      cocktailStats[recipe.cocktailId].eventCount += 1
    }

    const { totalLiquorCost } = calculateGrandTotals(batches, priceMap)
    const profit = revenue - totalLiquorCost
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0

    return {
      id: event.id,
      name: event.name,
      eventDate: event.eventDate,
      totalServings,
      revenue,
      ingredientCost: totalLiquorCost,
      profit,
      margin,
      recipeCount: event.recipes.length,
      recipeIds: event.recipes.map((r) => r.cocktailId),
    }
  })

  // Totals
  const totalRevenue = eventFinancials.reduce((s, e) => s + e.revenue, 0)
  const totalCost = eventFinancials.reduce((s, e) => s + e.ingredientCost, 0)
  const totalProfit = totalRevenue - totalCost
  const totalMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
  const totalServings = eventFinancials.reduce((s, e) => s + e.totalServings, 0)

  // Top cocktails by revenue
  const topCocktails = Object.values(cocktailStats)
    .sort((a, b) => b.revenue - a.revenue)

  // Monthly trend
  const monthlyMap: Record<string, { revenue: number; cost: number; profit: number }> = {}
  for (const e of eventFinancials) {
    const d = new Date(e.eventDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, cost: 0, profit: 0 }
    monthlyMap[key].revenue += e.revenue
    monthlyMap[key].cost += e.ingredientCost
    monthlyMap[key].profit += e.profit
  }

  const monthlyTrend = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month: formatMonth(month),
      revenue: data.revenue,
      cost: data.cost,
      profit: data.profit,
    }))

  return {
    events: eventFinancials,
    totals: {
      revenue: totalRevenue,
      cost: totalCost,
      profit: totalProfit,
      margin: totalMargin,
      eventCount: events.length,
      totalServings,
    },
    topCocktails,
    monthlyTrend,
  }
}

function formatMonth(yyyymm: string): string {
  const [year, month] = yyyymm.split("-")
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${months[parseInt(month, 10) - 1]} ${year}`
}
