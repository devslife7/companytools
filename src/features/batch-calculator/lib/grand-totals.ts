import type { BatchState, BatchResultWithCans, UnitType } from "../types"
import { calculateBatch } from "./calculations"
import { isLiquorItem, isSodaItem } from "./ingredient-helpers"

// Constants for can calculations
const CAN_SIZE_12OZ_ML = 354.882 // 12 fluid ounces in milliliters

// Utility to calculate Grand Totals for the PDF Report
export const calculateGrandTotals = (batches: BatchState[]): { 
  liquor: BatchResultWithCans[]; 
  soda: BatchResultWithCans[]; 
  other: BatchResultWithCans[] 
} => {
  const grandTotals: Record<string, { ml: number; bottles: number; quart: number; unitType: UnitType }> = {}

  batches.forEach(batch => {
    const servingsNum =
      typeof batch.servings === "number" ? batch.servings : batch.servings === "" ? 0 : parseInt(batch.servings, 10) || 0

    if (batch.editableRecipe && servingsNum > 0) {
      batch.editableRecipe.ingredients.forEach(item => {
        const result = calculateBatch(servingsNum, item.amount)
        // Only sum liquid ingredients for the shopping list
        if (result.unitType === "liquid") {
          const key = item.name.trim()
          if (!grandTotals[key]) {
            grandTotals[key] = { ml: 0, bottles: 0, quart: 0, unitType: "liquid" }
          }
          grandTotals[key].ml += result.ml
          grandTotals[key].bottles += result.bottles
          grandTotals[key].quart += result.quart
        }
      })
    }
  })

  const allItems: BatchResultWithCans[] = Object.entries(grandTotals)
    .map(([name, totals]) => {
      const item: BatchResultWithCans = { name, ...totals, originalUnit: "ml" }
      // Add 12oz can quantity for all soda items
      if (isSodaItem(name)) {
        item.cans12oz = Math.ceil(item.ml / CAN_SIZE_12OZ_ML)
      }
      return item
    })
    .sort((a, b) => b.ml - a.ml)

  // Separate liquor, soda, and other items
  const liquor: BatchResultWithCans[] = []
  const soda: BatchResultWithCans[] = []
  const other: BatchResultWithCans[] = []

  allItems.forEach(item => {
    // Check soda items FIRST (more specific) before liquor items (less specific)
    if (isSodaItem(item.name)) {
      soda.push(item)
    } else if (isLiquorItem(item.name)) {
      liquor.push(item)
    } else {
      other.push(item)
    }
  })

  return { liquor, soda, other }
}
