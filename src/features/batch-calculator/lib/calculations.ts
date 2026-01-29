import type { ParsedAmount, BatchResult, CocktailRecipe } from "../types"

// --- CONSTANTS ---
export const LITER_TO_ML = 1000
export const FIXED_BATCH_LITERS = 20 // Hardcoded fixed volume
export const CONVERSION_FACTORS: Record<string, number> = {
  oz: 29.5735,
  tsp: 4.9289,
  dash: 0.9,
  count: 1,
  top: 0,
}
export const QUART_TO_ML = 946.353
export const BOTTLE_SIZE_ML = 750
export const GALLON_TO_ML = 3785.41
export const CAN_SIZE_12OZ_ML = 354.882 // 12 fluid ounces in milliliters
export const BOTTLE_SIZE_4OZ_ML = 118.294 // 4 fluid ounces in milliliters

// --- PARSING UTILITIES ---

export const parseAmount = (amountString: string): ParsedAmount => {
  if (!amountString) return { baseAmount: 0, unit: "N/A", type: "special" }

  const lowerAmount = amountString.toLowerCase().trim()
  if (lowerAmount.includes("top") || lowerAmount.includes("n/a")) {
    return { baseAmount: 0, unit: "Top", type: "special" }
  }

  const countKeywords = ["egg white", "leaves", "slices", "beans"]
  const isCountItem = countKeywords.some(keyword => lowerAmount.includes(keyword))

  if (isCountItem) {
    // Regex to match numbers, including fractions, ranges, and decimals
    const match = lowerAmount.match(/([\d\.\/\,\-\s]+)/)
    let baseAmount = 1
    let unit = lowerAmount

    if (match) {
      const numStr = match[1].trim()
      const parseNumber = (s: string) => {
        s = s.replace(/\s+/g, "").replace(",", ".")
        if (s.includes("/")) {
          const parts = s.split("/")
          return parseFloat(parts[0]) / parseFloat(parts[1])
        }
        if (s.includes("-")) {
          const parts = s.split("-")
          return (parseFloat(parts[0]) + parseFloat(parts[1])) / 2
        }
        return parseFloat(s)
      }

      const number = parseNumber(numStr)
      if (!isNaN(number) && number > 0) {
        baseAmount = number
        unit = lowerAmount.replace(numStr, "").trim() || "count"
      }
    }
    return { baseAmount, unit: unit.replace(/\s+/g, " ").trim() || "count", type: "count" }
  }

  const match = lowerAmount.match(/([\d\.\/\,\-\s]+)\s*([a-z]+)?/)

  if (match) {
    let numberStr = match[1].trim()
    const rawUnit = match[2] ? match[2].replace(/s$/, "") : ""
    let unit: string = rawUnit

    const parseNumber = (s: string) => {
      s = s.replace(/\s+/g, "").replace(",", ".")
      if (s.includes("/")) {
        const parts = s.split("/")
        return parseFloat(parts[0]) / parseFloat(parts[1])
      }
      if (s.includes("-")) {
        const parts = s.split("-")
        return (parseFloat(parts[0]) + parseFloat(parts[1])) / 2
      }
      return parseFloat(s)
    }

    const baseAmount = parseNumber(numberStr)

    if (unit.startsWith("oz")) {
      unit = "oz"
    } else if (unit.startsWith("dash")) {
      unit = "dash"
    } else if (unit.startsWith("tsp")) {
      unit = "tsp"
    } else {
      unit = ""
    } // If unit is not recognized as liquid, treat it as part of count/special logic below

    if (unit) {
      return { baseAmount: baseAmount || 0, unit: unit, type: "liquid" }
    }

    // If no recognized liquid unit, fall back to count item
    return { baseAmount: baseAmount || 1, unit: rawUnit || "count", type: "count" }
  }

  // Default fallback for any unparsed text that might still be a count item
  return { baseAmount: 1, unit: lowerAmount || "count", type: "count" }
}

export const calculateBatch = (multiplier: number | string, amountString: string): BatchResult => {
  const mult = typeof multiplier === "number" ? multiplier : parseFloat(multiplier || "0")
  if (isNaN(mult) || mult <= 0) {
    return { ml: 0, quart: 0, bottles: 0, unitType: "special", originalUnit: "N/A" }
  }

  const { baseAmount, unit, type } = parseAmount(amountString)

  if (type === "special" || baseAmount === 0) {
    return { ml: 0, quart: 0, bottles: 0, unitType: "special", originalUnit: unit }
  }

  if (type === "count") {
    // For count items, we don't convert to liquid volume, result.ml stores the count
    return { ml: baseAmount * mult, quart: 0, bottles: 0, unitType: "count", originalUnit: unit }
  }

  const mlPerUnit = CONVERSION_FACTORS[unit] || 0
  const totalML = baseAmount * mlPerUnit * mult

  return {
    ml: totalML,
    quart: totalML / QUART_TO_ML,
    bottles: totalML / BOTTLE_SIZE_ML,
    unitType: "liquid",
    originalUnit: unit,
  }
}

// Utility to calculate total liquid volume of a single cocktail serving
export const calculateSingleServingLiquidVolumeML = (recipe: CocktailRecipe | null): number => {
  if (!recipe) return 0
  return recipe.ingredients.reduce((totalML, item) => {
    const { baseAmount, unit, type } = parseAmount(item.amount)
    if (type === "liquid") {
      const mlPerUnit = CONVERSION_FACTORS[unit] || 0
      return totalML + baseAmount * mlPerUnit
    }
    return totalML
  }, 0)
}

// --- FORMATTING UTILITIES ---

export const formatNumber = (num: number, decimals: number = 2): string => {
  if (typeof num !== "number" || isNaN(num) || !isFinite(num)) return "N/A"
  return num.toFixed(decimals).replace(/\.?0+$/, "")
}

// Utility to format ML, rounding UP to the nearest whole number (milliliter)
export const formatMLValue = (num: number): string => {
  if (typeof num !== "number" || isNaN(num) || !isFinite(num) || num <= 0) return "0"
  // Round up (Math.ceil) to the nearest whole number (milliliter) and ensure no decimals are displayed
  return Math.ceil(num).toFixed(0)
}

// Convert ML to preferred unit
export const convertMLToPreferredUnit = (ml: number, preferredUnit: string | null | undefined, existingCans12oz?: number, existingBottles4oz?: number): number | null => {
  if (!preferredUnit || ml <= 0) return null

  const unit = preferredUnit.toLowerCase().trim()

  switch (unit) {
    case "liters":
      return ml / LITER_TO_ML
    case "quarts":
      return ml / QUART_TO_ML
    case "gallons":
      return ml / GALLON_TO_ML
    case "12oz can":
    case "12oz cans":
      // Use existing cans12oz if available (already rounded up), otherwise calculate
      return existingCans12oz !== undefined ? existingCans12oz : Math.ceil(ml / CAN_SIZE_12OZ_ML)
    case "4oz bottle":
    case "4oz bottles":
      // Use existing bottles4oz if available (already rounded up), otherwise calculate
      return existingBottles4oz !== undefined ? existingBottles4oz : Math.ceil(ml / BOTTLE_SIZE_4OZ_ML)
    case "each":
      // "each" doesn't have a conversion, return null
      return null
    default:
      return null
  }
}

