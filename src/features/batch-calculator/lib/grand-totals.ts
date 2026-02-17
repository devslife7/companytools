import type { BatchState, BatchResultWithCans, UnitType } from "../types"
import { calculateBatch, convertMLToOrderUnit, parseAmount, combineAmountAndUnit, calculateSingleServingLiquidVolumeML, CONVERSION_FACTORS, LITER_TO_ML, QUART_TO_ML, BOTTLE_SIZE_ML } from "./calculations"
import { isLiquorItem, isSodaItem, isAngosturaBitters } from "./ingredient-helpers"

// Constants for can calculations
const CAN_SIZE_12OZ_ML = 354.882 // 12 fluid ounces in milliliters
const BOTTLE_SIZE_4OZ_ML = 118.294 // 4 fluid ounces in milliliters

// Price map type: lowercase ingredient name -> { price per bottle, bottle size in ml }
export type LiquorPriceMap = Record<string, { price: number; bottleSizeMl: number }>

// Look up bottle price for an ingredient name (case-insensitive exact match, then keyword fallback)
function lookupBottlePrice(name: string, priceMap: LiquorPriceMap): { price: number; bottleSizeMl: number } | null {
  const lower = name.toLowerCase().trim()

  // Exact match
  if (priceMap[lower]) return priceMap[lower]

  // Keyword fallback: check if ingredient name contains a price entry key or vice versa
  for (const [priceName, entry] of Object.entries(priceMap)) {
    if (lower.includes(priceName) || priceName.includes(lower)) {
      return entry
    }
  }

  return null
}

export interface GrandTotalsResult {
  liquor: BatchResultWithCans[]
  soda: BatchResultWithCans[]
  other: BatchResultWithCans[]
  totalLiquorCost: number
}

// Utility to calculate Grand Totals for the PDF Report
export const calculateGrandTotals = (batches: BatchState[], priceMap?: LiquorPriceMap): GrandTotalsResult => {
  const grandTotals: Record<string, { ml: number; bottles: number; quart: number; unitType: UnitType; orderUnit?: string; eachCount?: number }> = {}

  batches.forEach(batch => {
    if (!batch.editableRecipe) return

    const servingsNum =
      typeof batch.servings === "number" ? batch.servings : batch.servings === "" ? 0 : parseInt(batch.servings, 10) || 0

    // Process batches with servings > 0
    if (servingsNum > 0) {
      batch.editableRecipe.ingredients.forEach(item => {
        const result = calculateBatch(servingsNum, item.amount, item.unit)
        const key = item.name.trim()
        
        // Check if this item has "each" as order unit
        const hasEachOrderUnit = item.orderUnit?.toLowerCase().trim() === "each"

        // Include liquid ingredients OR items with "each" as order unit
        if (result.unitType === "liquid" || hasEachOrderUnit) {
          if (!grandTotals[key]) {
            grandTotals[key] = { ml: 0, bottles: 0, quart: 0, unitType: result.unitType }
          }

          if (result.unitType === "liquid") {
            grandTotals[key].ml += result.ml
            grandTotals[key].bottles += result.bottles
            grandTotals[key].quart += result.quart
          }

          // For "each" items, calculate total count (multiply amount per serving by servings)
          if (hasEachOrderUnit) {
            const amountString = combineAmountAndUnit(item.amount, item.unit)
            const { baseAmount } = parseAmount(amountString)
            if (!grandTotals[key].eachCount) {
              grandTotals[key].eachCount = 0
            }
            grandTotals[key].eachCount = (grandTotals[key].eachCount || 0) + (baseAmount * servingsNum)
          }

          // Store order unit if not already set (use first one found)
          if (item.orderUnit && !grandTotals[key].orderUnit) {
            grandTotals[key].orderUnit = item.orderUnit
          }
        }
      })
    }
    // Process batches with targetLiters > 0 but no servings
    else if (batch.targetLiters > 0) {
      const singleServingVolumeML = calculateSingleServingLiquidVolumeML(batch.editableRecipe)
      
      if (singleServingVolumeML > 0) {
        const targetLitersML = batch.targetLiters * LITER_TO_ML
        
        batch.editableRecipe.ingredients.forEach(item => {
          const amountString = combineAmountAndUnit(item.amount, item.unit)
          const { baseAmount, unit, type } = parseAmount(amountString)
          const key = item.name.trim()
          
          // Check if this item has "each" as order unit
          const hasEachOrderUnit = item.orderUnit?.toLowerCase().trim() === "each"

          // Include liquid ingredients OR items with "each" as order unit
          if (type === "liquid" || hasEachOrderUnit) {
            if (!grandTotals[key]) {
              grandTotals[key] = { ml: 0, bottles: 0, quart: 0, unitType: type }
            }

            if (type === "liquid") {
              const ingredientML = baseAmount * (CONVERSION_FACTORS[unit] || 0)
              const proportion = ingredientML / singleServingVolumeML
              const finalML = targetLitersML * proportion

              grandTotals[key].ml += finalML
              grandTotals[key].bottles += finalML / BOTTLE_SIZE_ML
              grandTotals[key].quart += finalML / QUART_TO_ML
            }

            // For "each" items, calculate based on number of servings in target liters
            if (hasEachOrderUnit) {
              // Calculate how many servings fit in target liters
              const approximateServings = targetLitersML / singleServingVolumeML
              if (!grandTotals[key].eachCount) {
                grandTotals[key].eachCount = 0
              }
              // baseAmount is the count per serving, multiply by number of servings
              grandTotals[key].eachCount = (grandTotals[key].eachCount || 0) + (baseAmount * approximateServings)
            }

            // Store order unit if not already set (use first one found)
            if (item.orderUnit && !grandTotals[key].orderUnit) {
              grandTotals[key].orderUnit = item.orderUnit
            }
          }
        })
      }
    }
  })

  const allItems: BatchResultWithCans[] = Object.entries(grandTotals)
    .map(([name, totals]) => {
      const item: BatchResultWithCans = {
        name,
        ...totals,
        originalUnit: "ml",
        ...(totals.orderUnit && { orderUnit: totals.orderUnit })
      }
      // Add 12oz can quantity for all soda items
      if (isSodaItem(name)) {
        item.cans12oz = Math.ceil(item.ml / CAN_SIZE_12OZ_ML)
        // Auto-set order unit for soda items if not already set
        if (!item.orderUnit) {
          item.orderUnit = "12oz can"
        }
      }
      // Add 4oz bottle quantity for Angostura bitters
      if (isAngosturaBitters(name)) {
        item.bottles4oz = Math.ceil(item.ml / BOTTLE_SIZE_4OZ_ML)
        // Auto-set order unit for Angostura bitters if not already set
        if (!item.orderUnit) {
          item.orderUnit = "4oz bottle"
        }
      }
      // Calculate order unit value if order unit is set
      if (item.orderUnit) {
        const orderUnitLower = item.orderUnit.toLowerCase().trim()
        if (orderUnitLower === "each" && totals.eachCount !== undefined) {
          // For "each" items, use the calculated count
          item.orderUnitValue = totals.eachCount
        } else {
          item.orderUnitValue = convertMLToOrderUnit(
            item.ml,
            item.orderUnit,
            item.cans12oz,
            item.bottles4oz
          )
        }
      }
      return item
    })
    .sort((a, b) => b.ml - a.ml)

  // Separate liquor, soda, and other items
  const liquor: BatchResultWithCans[] = []
  const soda: BatchResultWithCans[] = []
  const other: BatchResultWithCans[] = []

  let totalLiquorCost = 0

  allItems.forEach(item => {
    // Check soda items FIRST (more specific) before liquor items (less specific)
    if (isSodaItem(item.name)) {
      soda.push(item)
    } else if (isLiquorItem(item.name)) {
      // Look up price and calculate cost if price map is available
      if (priceMap) {
        const priceEntry = lookupBottlePrice(item.name, priceMap)
        if (priceEntry) {
          item.bottlePrice = priceEntry.price
          item.bottlesToBuy = Math.ceil(item.ml / priceEntry.bottleSizeMl)
          item.estimatedCost = item.bottlesToBuy * priceEntry.price
          totalLiquorCost += item.estimatedCost
        }
      }
      liquor.push(item)
    } else {
      other.push(item)
    }
  })

  return { liquor, soda, other, totalLiquorCost }
}
