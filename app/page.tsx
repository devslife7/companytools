"use client"
import React, { useState, useMemo, useEffect, useCallback } from "react"
import { Search, Calculator, Ruler, FlaskConical, Wine, Edit2, Check, PlusCircle, Trash2, X } from "lucide-react"

// --- TYPE DEFINITIONS (Interfaces) ---

interface Ingredient {
  name: string
  amount: string
}

interface CocktailRecipe {
  name: string
  garnish: string
  method: string
  ingredients: Ingredient[]
}

type UnitType = "liquid" | "count" | "special"

interface ParsedAmount {
  baseAmount: number
  unit: string
  type: UnitType
}

interface BatchResult {
  [x: string]: any
  ml: number
  quart: number
  bottles: number
  unitType: UnitType
  originalUnit: string
  singleAmount?: string // Used internally for combined ingredients
}

interface BatchState {
  id: number
  selectedCocktail: CocktailRecipe | null
  editableRecipe: CocktailRecipe | null
  servings: number | ""
  targetLiters: number // Fixed to 20L
  searchTerm: string
}

// --- COCKTAIL DATABASE (Typed) ---

const COCKTAIL_DATA: CocktailRecipe[] = [
  {
    name: "Autumn Bloom Mocktail",
    garnish: "Mint sprig and Lavender sprig",
    method:
      "Add all ingredients (except cider) to a shaker with ice. Shake briefly to chill. Strain into a glass with fresh ice. Top with sparkling cider and stir gently.",
    ingredients: [
      { name: "Sparkling Apple Cider", amount: "3 oz" },
      { name: "Pear Nectar/Juice", amount: "1 oz" },
      { name: "Orange Juice", amount: "1 oz" },
      { name: "Cinnamon Syrup", amount: "0.75 oz" },
    ],
  },
  {
    name: "Blackberry Collins",
    garnish: "Blackberry Wrapped in Mint Leaf on a Skewer",
    method:
      "1. Combine vodka, lemon juice, simple syrup, and blackberry puree into a cocktail shaker filled with ice. 2. Shake until ingredients are properly chilled and strain into a collins glass filled with ice. 3. Top off with ginger beer. 4. Add edible gold dust.",
    ingredients: [
      { name: "Vodka", amount: "1.5 oz" },
      { name: "Lemon Juice", amount: "0.75 oz" },
      { name: "Simple Syrup", amount: "0.75 oz" },
      { name: "Blackberry Puree", amount: "25 oz" },
      { name: "Ginger Beer", amount: "3 oz" },
    ],
  },
  {
    name: "Blue and Yellow Mimosa",
    garnish: "Mint sprig and Lavender sprig",
    method: "Pour blue coracao last",
    ingredients: [
      { name: "Prosecco", amount: "2 oz" },
      { name: "Orange Juice", amount: "2 oz" },
      { name: "Blue Curacao", amount: "0.25 oz" },
    ],
  },
  {
    name: "Classic Pisco Sour",
    garnish: "Angostura Bitters (3-5 drops)",
    method:
      "1. Add Pisco, Lime Juice, Simple Syrup, and Egg White to a shaker and dry-shake (without ice) vigorously. 2. Add ice and shake again until well-chilled. 3. Strain into a chilled glass (Timeless Cocktail). 4. Garnish with Angostura bitters drops.",
    ingredients: [
      { name: "Pisco", amount: "2 oz" },
      { name: "Lime Juice", amount: "1 oz" },
      { name: "Simple Syrup", amount: "0.75 oz" },
      { name: "Egg White", amount: "1" }, // Count item
    ],
  },
  {
    name: "Espresso Martini",
    garnish: "3 coffee beans",
    method: "Shaken",
    ingredients: [
      { name: "Vodka", amount: "2 oz" },
      { name: "Espresso", amount: "1 oz" },
      { name: "Kahlua (Coffee Liqueur)", amount: "0.5 oz" },
      { name: "Simple syrup", amount: "0.25 oz" },
    ],
  },
  {
    name: "Old Fashioned",
    garnish: "Lemon Twist",
    method:
      "1. Combine all ingredients in a tin filled with ice. 2. Stir until well-chilled. 3. Strain into a rocks glass filled with fresh ice.",
    ingredients: [
      { name: "Bourbon or Rye", amount: "2 oz" },
      { name: "Simple Syrup", amount: "0.5 oz" },
      { name: "Angostura Bitters", amount: "3 Dashes" },
    ],
  },
  {
    name: "Pear & Ginger Moscow Mule",
    garnish: "Pear Slice",
    method:
      "1. Combine vodka, pear puree, lime juice, and cardamom with ice. 2. Shake well. 3. Strain into a glass with ice. 4. Top with ginger beer and stir gently.",
    ingredients: [
      { name: "Vodka", amount: "2 oz" },
      { name: "Pear Puree", amount: "2 oz" },
      { name: "Lime Juice", amount: "0.5 oz" },
      { name: "Ground Cardamom", amount: "0.25 tsp" },
      { name: "Ginger Beer", amount: "0.4 oz" },
    ],
  },
  {
    name: "Peruvian Garden Spritz",
    garnish: "Cucumber Ribbon & Mint Sprig",
    method:
      "1. Muddle Cucumber Slices and Mint Leaves. 2. Add Pisco and Lime Juice to Infuse. 3. Fill Glass with Ice and Strain Mixture. 4. Top with Sparkling Wine and Soda Water. 5. Stir gently.",
    ingredients: [
      { name: "Pisco", amount: "1.5 oz" },
      { name: "Lime Juice", amount: "0.5 oz" },
      { name: "Sparkling Wine", amount: "2 oz" },
      { name: "Soda Water", amount: "2 oz" },
      { name: "Thin Cucumber Slices", amount: "2" },
      { name: "Mint Leaves", amount: "5" },
    ],
  },
  {
    name: "Rhubarb Sour",
    garnish: "Mint sprig and Lavender sprig",
    method:
      "1. Dry Shake: Combine all ingredients (except ice) in a shaker and shake vigorously for 30 seconds. 2. Wet Shake: Add ice and shake again until chilled. Double-strain into a coupe or rocks glass.",
    ingredients: [
      { name: "Base Spirit (Whiskey or Gin)", amount: "2 oz" },
      { name: "Fresh Lemon Juice", amount: "1 oz" },
      { name: "Rhubarb Simple Syrup", amount: "1 oz" },
      { name: "Egg White (or Aquafaba)", amount: "1 large egg white (or 0.5 oz)" },
    ],
  },
  {
    name: "Rose Garden",
    garnish: "Edible Gold Dust (Added)",
    method: "Baby Pansy",
    ingredients: [
      { name: "Vodka", amount: "1.5 oz" },
      { name: "Lemon Juice", amount: "0.5 oz" },
      { name: "Cardamon Simple Syrup", amount: "0.5 oz" },
      { name: "Spindrift GrapeFruit Seltzer", amount: "3 oz" },
      { name: "Rose Hydrolat", amount: "3 dashes" },
    ],
  },
  {
    name: "Ruby Red Anniversary Daiquiri",
    garnish: "Mint sprig and Lavender sprig",
    method:
      "Combine all ingredients in a shaker with ice. Shake vigorously until chilled. Double-strain into a coupe glass.",
    ingredients: [
      { name: "White Rum", amount: "2 oz" },
      { name: "Fresh Ruby Red Grapefruit Juice", amount: "1 oz" },
      { name: "Fresh Lime Juice", amount: "0.5 oz" },
      { name: "Simple Syrup (1:1)", amount: "0.5 oz" },
      { name: "Maraschino Liqueur (Optional)", amount: "0.25 oz" },
    ],
  },
  {
    name: "Sage and Ginger Paloma",
    garnish: "Sage Leaf",
    method: "This cocktail is available on the bar all night.",
    ingredients: [
      { name: "Tequila (Reposado)", amount: "2 oz" },
      { name: "Sage Infused Honey", amount: "1 oz" },
      { name: "Grapefruit Juice", amount: "2 oz" },
      { name: "Lime Juice", amount: "0.5 oz" },
      { name: "Ginger Beer", amount: "Top" },
    ],
  },
  {
    name: "Sparkling Pear French 75",
    garnish: "Mint sprig and Lavender sprig",
    method: "Pour blue coracao last",
    ingredients: [
      { name: "Gin", amount: "1 oz" },
      { name: "Lemon Juice", amount: "0.5 oz" },
      { name: "Peary Syrup (del monte sliced pears can)", amount: "1 oz" },
      { name: "Champagne", amount: "3 oz" },
    ],
  },
  {
    name: "Whiskey Honey Lemonade",
    garnish: "Mint sprig and Lavender sprig",
    method: "Baby Pansy",
    ingredients: [
      { name: "Bourbon", amount: "2 oz" },
      { name: "Lemonade (Freshly Squeezed)", amount: "4 oz" },
      { name: "Honey-Lavender Syrup", amount: "0.5 oz" },
      { name: "Mint Sprigs", amount: "3-4 leaves" },
    ],
  },
]

// --- UNIT CONVERSION UTILITIES ---
const LITER_TO_ML = 1000
const FIXED_BATCH_LITERS = 20 // Hardcoded fixed volume
const CONVERSION_FACTORS: Record<string, number> = {
  oz: 29.5735,
  tsp: 4.9289,
  dash: 0.9,
  count: 1,
  top: 0,
}
const QUART_TO_ML = 946.353
const BOTTLE_SIZE_ML = 750

const parseAmount = (amountString: string): ParsedAmount => {
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

const calculateBatch = (multiplier: number | string, amountString: string): BatchResult => {
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
const calculateSingleServingLiquidVolumeML = (recipe: CocktailRecipe | null): number => {
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

const formatNumber = (num: number, decimals: number = 2): string => {
  if (typeof num !== "number" || isNaN(num) || !isFinite(num)) return "N/A"
  return num.toFixed(decimals).replace(/\.?0+$/, "")
}

// NEW: Utility to format ML, rounding UP to the nearest whole number (milliliter)
const formatMLValue = (num: number): string => {
  if (typeof num !== "number" || isNaN(num) || !isFinite(num) || num <= 0) return "0"
  // Round up (Math.ceil) to the nearest whole number (milliliter) and ensure no decimals are displayed
  return Math.ceil(num).toFixed(0)
}

// --- REUSABLE COMPONENTS ---

interface BatchInputProps {
  value: number | ""
  onChange: (value: string) => void
  disabled: boolean
  label: string
  id: string
  icon: React.ElementType
  unit?: string
}

const BatchInput: React.FC<BatchInputProps> = React.memo(({ value, onChange, disabled, label, id, icon: Icon, unit }) => (
  <div className="flex flex-col space-y-1">
    <label htmlFor={id} className="text-sm font-medium text-gray-600">
      {label}
    </label>
    <div className="relative">
      <Icon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-600" />
      <input
        id={id}
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        min="0"
        step={unit === "L" ? "0.5" : "1"}
        className={`w-full py-2 pl-9 pr-11 bg-gray-50 text-gray-900 border rounded-lg focus:ring-2 focus:ring-orange-500 transition duration-300 shadow-sm ${
          disabled ? "opacity-60 cursor-not-allowed border-gray-300" : "border-gray-300 focus:border-orange-500"
        }`}
        disabled={disabled}
      />
      {unit && <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">{unit}</span>}
    </div>
  </div>
))

interface CocktailSelectorProps {
  selected: CocktailRecipe | null
  onSelect: (cocktail: CocktailRecipe) => void
  searchTerm: string
  onSearch: (term: string) => void
  cocktails: CocktailRecipe[]
  label: string
}

const CocktailSelector: React.FC<CocktailSelectorProps> = React.memo(
  ({ selected, onSelect, searchTerm, onSearch, cocktails, label }) => {
    const filteredCocktails = useMemo(() => {
      return cocktails.filter(cocktail => cocktail.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [searchTerm, cocktails])

    return (
      <div className="flex flex-col space-y-1">
        <label htmlFor={`search-${label}`} className="text-sm font-medium text-gray-600">
          {label}
        </label>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-600" />
          <input
            id={`search-${label}`}
            type="text"
            placeholder="Search for a recipe..."
            value={searchTerm}
            onChange={e => onSearch(e.target.value)}
            className="w-full py-2 pl-9 pr-4 bg-gray-50 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition duration-300 shadow-sm focus:border-orange-500"
          />
        </div>

        {searchTerm && filteredCocktails.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto pr-1 border border-gray-300 rounded-lg bg-white shadow-lg">
            <div className="space-y-1 p-1">
              {filteredCocktails.map(cocktail => (
                <button
                  key={cocktail.name}
                  onClick={() => onSelect(cocktail)}
                  className={`w-full text-left p-2 rounded-md transition duration-200 ease-in-out flex justify-between items-center ${
                    selected?.name === cocktail.name
                      ? "bg-orange-100 border border-orange-500 text-gray-900 shadow-md"
                      : "bg-white hover:bg-gray-100 border border-gray-200 text-gray-700"
                  }`}
                >
                  <span className="font-semibold">{cocktail.name}</span>
                  {selected?.name === cocktail.name && <Check className="w-5 h-5 text-orange-600" />}
                </button>
              ))}
            </div>
          </div>
        )}
        {searchTerm && filteredCocktails.length === 0 && (
          <p className="text-red-600 p-3 bg-red-50 rounded-lg border border-red-300">
            No recipes found matching "{searchTerm}".
          </p>
        )}
      </div>
    )
  }
)

interface CombinedIngredient extends Ingredient {
  isLiquid: boolean
  isCount: boolean
  isSpecial: boolean
  servings: BatchResult
  target: BatchResult
}

interface SingleBatchDisplayProps {
  batch: BatchState
  onIngredientChange: (id: number, newIngredients: Ingredient[]) => void
  onNameChange: (id: number, newName: string) => void
}

const SingleBatchDisplay: React.FC<SingleBatchDisplayProps> = React.memo(
  ({ batch, onIngredientChange, onNameChange }) => {
    const { editableRecipe: recipe, servings, id } = batch
    const [isEditing, setIsEditing] = useState(false)

    // Ensure servings is treated as a number for calculation
    const servingsNum = typeof servings === "number" ? servings : servings === "" ? 0 : parseInt(servings, 10) || 0

    // The target liters is now fixed
    const targetLiters = FIXED_BATCH_LITERS
    const twentyLiterML = FIXED_BATCH_LITERS * LITER_TO_ML // 20000 ML

    // 1. Calculate the total liquid volume of a single cocktail serving
    const singleServingVolumeML = useMemo(() => {
      return calculateSingleServingLiquidVolumeML(recipe)
    }, [recipe])

    // 2. Calculate ingredients for the Servings Batch (user input)
    const servingsBatchIngredients: BatchResult[] = useMemo(() => {
      if (!recipe || servingsNum <= 0) return []

      return recipe.ingredients.map(item => {
        const batchResult = calculateBatch(servingsNum, item.amount)
        return { ...batchResult, singleAmount: item.amount, name: item.name }
      })
    }, [recipe, servingsNum])

    // Calculate total liquid volume for the servings batch
    const totalServingsLiquidML = servingsBatchIngredients.reduce((sum, ing) => sum + ing.ml, 0)

    // CONDITION CHECK: Should the fixed batch table be displayed?
    const shouldShowFixedBatch = totalServingsLiquidML > twentyLiterML && singleServingVolumeML > 0

    // 3. Calculate ingredients for the Fixed Target Liter Batch (proportional batching for 20L)
    const targetBatchIngredients: BatchResult[] = useMemo(() => {
      if (!recipe || targetLiters <= 0 || singleServingVolumeML === 0) return []

      const targetML = twentyLiterML

      return recipe.ingredients.map(item => {
        const { baseAmount, unit, type } = parseAmount(item.amount)

        if (type !== "liquid") {
          // Count and special items do not scale with liquid volume target.
          return {
            ml: 0,
            quart: 0,
            bottles: 0,
            unitType: type,
            originalUnit: unit,
            singleAmount: item.amount,
            name: item.name,
          }
        }

        const ingredientML = baseAmount * (CONVERSION_FACTORS[unit] || 0)
        // Proportion of this ingredient in one serving's total liquid volume
        const proportion = ingredientML / singleServingVolumeML

        const finalML = targetML * proportion

        return {
          ml: finalML,
          quart: finalML / QUART_TO_ML,
          bottles: finalML / BOTTLE_SIZE_ML,
          unitType: "liquid",
          originalUnit: unit,
          singleAmount: item.amount,
          name: item.name,
        }
      })
    }, [recipe, twentyLiterML, singleServingVolumeML, targetLiters])

    // Combined list of ingredients for table display
    const combinedIngredients: CombinedIngredient[] = useMemo(() => {
      if (!recipe) return []

      return recipe.ingredients.map((item, index) => {
        const parsed = parseAmount(item.amount)
        const servingsCalc = servingsBatchIngredients[index] || ({} as BatchResult)
        const targetCalc = targetBatchIngredients[index] || ({} as BatchResult)

        return {
          name: item.name,
          amount: item.amount, // This is the singleAmount
          singleAmount: item.amount,
          isLiquid: parsed.type === "liquid",
          isCount: parsed.type === "count",
          isSpecial: parsed.type === "special",
          servings: servingsCalc,
          target: targetCalc,
        }
      })
    }, [recipe, servingsBatchIngredients, targetBatchIngredients])

    const handleIngredientUpdate = (index: number, field: keyof Ingredient, value: string) => {
      if (!recipe) return
      const newIngredients = [...recipe.ingredients]
      newIngredients[index] = { ...newIngredients[index], [field]: value }
      onIngredientChange(id, newIngredients)
    }

    const handleAddIngredient = () => {
      if (!recipe) return
      const newIngredients: Ingredient[] = [...recipe.ingredients, { name: "", amount: "" }]
      onIngredientChange(id, newIngredients)
    }

    const handleRemoveIngredient = (index: number) => {
      if (!recipe) return
      const newIngredients = recipe.ingredients.filter((_, i) => i !== index)
      onIngredientChange(id, newIngredients)
    }

    if (!recipe)
      return (
        <div className="p-4 bg-gray-50 border border-gray-300 rounded-xl mt-4 text-center text-gray-500">
          <FlaskConical className="w-8 h-8 mx-auto mb-2 text-orange-600" />
          <p>Select a cocktail above to see its recipe and batch calculations.</p>
        </div>
      )

    return (
      <div className="mt-4 border border-gray-300 rounded-xl overflow-hidden shadow-lg">
        {/* Header/Control Panel */}
        <div className="p-3 bg-gray-100 flex justify-between items-center border-b border-gray-300">
          {isEditing ? (
            <input
              type="text"
              value={recipe.name}
              onChange={e => onNameChange(id, e.target.value)}
              className="text-xl font-extrabold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 w-full max-w-md focus:ring-2 focus:ring-orange-500"
              placeholder="Cocktail Name"
            />
          ) : (
            <h3 className="text-xl font-extrabold text-gray-900">
              Batch #{id}: {recipe.name}
            </h3>
          )}

          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2 rounded-full transition duration-200 shadow-sm border ${
                isEditing ? "bg-green-100 border-green-500" : "bg-white border-gray-300 hover:bg-gray-200"
              }`}
              title={isEditing ? "Save Changes" : "Edit Recipe"}
            >
              {isEditing ? <Check className="w-5 h-5 text-green-600" /> : <Edit2 className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-white">
          <p className="text-sm text-gray-600 mb-3 border-b border-gray-200 pb-1">
            **Garnish:** {recipe.garnish || "N/A"} | **Method:** {recipe.method || "N/A"}
          </p>

          <h4 className="text-lg font-semibold text-orange-600 mb-2">Ingredients (1 Serving)</h4>
          <div className="space-y-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
            {recipe.ingredients.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center border-b border-gray-200 pb-1 last:border-b-0"
              >
                {isEditing ? (
                  <div className="flex items-center w-full space-x-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => handleIngredientUpdate(index, "name", e.target.value)}
                      className="flex-grow py-1 px-2 bg-white text-gray-700 rounded border border-gray-300 focus:ring-orange-500 focus:border-orange-500 text-sm"
                      placeholder="Ingredient Name"
                    />
                    <input
                      type="text"
                      value={item.amount}
                      onChange={e => handleIngredientUpdate(index, "amount", e.target.value)}
                      className="w-24 py-1 px-2 text-right bg-white text-orange-600 rounded border border-gray-300 focus:ring-orange-500 focus:border-orange-500 text-sm"
                      placeholder="Amount"
                    />
                    <button
                      onClick={() => handleRemoveIngredient(index)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-gray-700">{item.name}</span>
                    <span className="font-mono text-orange-600">{item.amount}</span>
                  </>
                )}
              </div>
            ))}
            {isEditing && (
              <button
                onClick={handleAddIngredient}
                className="w-full mt-2 py-2 flex items-center justify-center text-sm font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded border border-dashed border-orange-300 transition-colors"
              >
                <PlusCircle className="w-4 h-4 mr-1" /> Add Ingredient
              </button>
            )}
          </div>

          {/* Batch Totals Table */}
          {(servingsNum > 0 || singleServingVolumeML > 0) && (
            <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-xl shadow-inner">
              <div className="flex items-center space-x-2 mb-3">
                <Ruler className="w-6 h-6 text-orange-600" />
                <h4 className="text-xl font-bold text-gray-900">Batch Totals</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3 border-b border-gray-200 pb-2">
                1 Serving Liquid Volume: {formatNumber(singleServingVolumeML / 29.5735)} oz (
                {formatNumber(singleServingVolumeML)} ml)
                {singleServingVolumeML === 0 && (
                  <span className="text-red-600 ml-2"> (Cannot perform proportional batching.)</span>
                )}
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  {/* Servings Based Calculation (Calculation 1) */}
                  <thead className="text-gray-900 bg-gray-200/80">
                    <tr>
                      <th className="py-1 px-1 text-left w-1/3 border-b-2 border-orange-600" rowSpan={2}>
                        INGREDIENT
                      </th>
                      <th className="py-1 px-1 text-center" colSpan={3}>
                        Calculation 1: {servingsNum} Servings (Total {formatNumber(totalServingsLiquidML / LITER_TO_ML)}{" "}
                        L)
                      </th>
                    </tr>
                    <tr className="bg-gray-200/80">
                      <th className="py-1 px-1 text-right">ML</th>
                      <th className="py-1 px-1 text-right">QUARTS (Q)</th>
                      <th className="py-1 px-1 text-right">@750 BOTTLES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedIngredients.map((ing, ingIndex) => (
                      <tr
                        key={`${ing.name}-servings`}
                        className="border-t border-gray-200 hover:bg-gray-100 transition duration-150"
                      >
                        <td className="py-1 px-1 text-gray-700 font-medium border-r border-gray-200">{ing.name}</td>
                        {ing.isLiquid ? (
                          <>
                            <td className="py-1 px-1 text-right font-mono text-gray-900">
                              {formatMLValue(ing.servings.ml)}
                            </td>
                            <td className="py-1 px-1 text-right font-mono text-gray-900">
                              {formatNumber(ing.servings.quart)}
                            </td>
                            <td className="py-1 px-1 text-right font-mono text-gray-900">
                              {formatNumber(ing.servings.bottles)}
                            </td>
                          </>
                        ) : (
                          <td colSpan={3} className="py-1 px-1 text-center font-mono text-gray-400">
                            {ing.isCount
                              ? `${formatNumber(ing.servings.ml, 0)} ${ing.servings.originalUnit} (Count Item)`
                              : `${ing.servings.originalUnit} (To Taste/Top)`}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Fixed 20L Target Based Calculation (Calculation 2) */}
                {shouldShowFixedBatch ? (
                  <table className="min-w-full text-sm mt-6">
                    <thead className="text-gray-900 bg-gray-200/80">
                      <tr>
                        <th className="py-1 px-1 text-left w-1/3 border-b-2 border-orange-600" rowSpan={2}>
                          INGREDIENT
                        </th>
                        <th className="py-1 px-1 text-center" colSpan={3}>
                          Calculation 2: Fixed Proportional Batch for {targetLiters} Liters
                        </th>
                      </tr>
                      <tr className="bg-gray-200/80">
                        <th className="py-1 px-1 text-right">ML</th>
                        <th className="py-1 px-1 text-right">QUARTS (Q)</th>
                        <th className="py-1 px-1 text-right">@750 BOTTLES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {combinedIngredients.map((ing, ingIndex) => (
                        <tr
                          key={`${ing.name}-target`}
                          className="border-t border-gray-200 hover:bg-gray-100 transition duration-150"
                        >
                          <td className="py-1 px-1 text-gray-700 font-medium border-r border-gray-200">{ing.name}</td>
                          {ing.isLiquid ? (
                            <>
                              <td className="py-1 px-1 text-right font-mono text-orange-600">
                                {formatMLValue(ing.target.ml)}
                              </td>
                              <td className="py-1 px-1 text-right font-mono text-orange-600">
                                {formatNumber(ing.target.quart)}
                              </td>
                              <td className="py-1 px-1 text-right font-mono text-orange-600">
                                {formatNumber(ing.target.bottles)}
                              </td>
                            </>
                          ) : (
                            <td colSpan={3} className="py-1 px-1 text-center font-mono text-gray-400">
                              Count items cannot be proportionally batched by volume.
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  singleServingVolumeML > 0 && (
                    <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-gray-700 text-center">
                      The Proportional {targetLiters}L Batch calculation is hidden because your current {servingsNum}{" "}
                      Servings Batch total ({formatNumber(totalServingsLiquidML / LITER_TO_ML)} L) is less than the{" "}
                      {targetLiters} L threshold.
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
)

interface BatchItemProps {
  batch: BatchState
  onSelect: (id: number, cocktail: CocktailRecipe) => void
  onServingsChange: (id: number, value: string) => void
  onSearchTermChange: (id: number, term: string) => void
  onIngredientChange: (id: number, newIngredients: Ingredient[]) => void
  onNameChange: (id: number, newName: string) => void
  onRemove: (id: number) => void
  isOnlyItem: boolean
}

// New memoized component for each slot (Crucial for performance fix)
const BatchItem: React.FC<BatchItemProps> = React.memo(
  ({ batch, onSelect, onServingsChange, onSearchTermChange, onIngredientChange, onNameChange, onRemove, isOnlyItem }) => {
    const { servings, searchTerm, editableRecipe, id } = batch

    return (
      <div className="p-3 sm:p-4 bg-white border border-gray-300 rounded-xl shadow-xl mb-4 transition-all duration-500 hover:border-orange-500">
        <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center">
            <FlaskConical className="w-6 h-6 mr-2 text-orange-600" />
            Cocktail Slot #{id}
          </h2>
          {!isOnlyItem && (
            <button
              onClick={() => onRemove(id)}
              className="p-2 rounded-full bg-red-500 hover:bg-red-600 transition duration-200 shadow-lg text-white"
              title="Remove this batch"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <CocktailSelector
              selected={batch.selectedCocktail}
              onSelect={cocktail => onSelect(id, cocktail)}
              searchTerm={searchTerm}
              onSearch={term => onSearchTermChange(id, term)}
              cocktails={COCKTAIL_DATA}
              label={`Search Cocktail Recipe for Slot #${id}`}
            />
          </div>
          {/* Servings Input (The primary user input) */}
          <BatchInput
            value={servings}
            onChange={value => onServingsChange(id, value)}
            disabled={!editableRecipe}
            id={`servings-${id}`}
            label="Target Servings (Cups)"
            icon={Calculator}
          />
        </div>
        {/* Display for both Servings Batch and Fixed 20L Batch */}
        <SingleBatchDisplay batch={batch} onIngredientChange={onIngredientChange} onNameChange={onNameChange} />
      </div>
    )
  }
)

// Utility to calculate Grand Totals for the PDF Report
const calculateGrandTotals = (batches: BatchState[]): BatchResult[] => {
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

  return Object.entries(grandTotals)
    .map(([name, totals]) => ({ name, ...totals, originalUnit: "ml" })) // originalUnit is added for type compliance
    .sort((a, b) => b.ml - a.ml)
}

// --- MAIN APP COMPONENT ---
export default function Home() {
  const defaultServings: number = 120
  const [batches, setBatches] = useState<BatchState[]>([])
  const [nextId, setNextId] = useState<number>(1)

  // Initialize with one empty batch slot on load
  useEffect(() => {
    if (batches.length === 0) {
      handleAddBatch()
    }
  }, [batches]) // Adding batches to dependency array to satisfy ESLint rule for initial check

  // --- CRUD Handlers for Batches Array (Memoized using useCallback) ---

  const handleUpdateBatch = useCallback((id: number, updates: Partial<BatchState>) => {
    setBatches(prev => prev.map(batch => (batch.id === id ? { ...batch, ...updates } : batch)))
  }, [])

  const handleAddBatch = useCallback(() => {
    const newBatch: BatchState = {
      id: nextId,
      selectedCocktail: null,
      editableRecipe: null,
      servings: defaultServings,
      targetLiters: FIXED_BATCH_LITERS, // Fixed to 20L
      searchTerm: "",
    }
    setBatches(prev => [...prev, newBatch])
    setNextId(prev => prev + 1)
  }, [nextId, defaultServings])

  const handleRemoveBatch = useCallback((idToRemove: number) => {
    setBatches(prev => prev.filter(batch => batch.id !== idToRemove))
  }, [])

  // --- Specific Data Handlers (Memoized using useCallback) ---

  const handleSelectCocktail = useCallback(
    (id: number, cocktail: CocktailRecipe) => {
      // Deep copy of the recipe for editing
      const editableRecipe = JSON.parse(JSON.stringify(cocktail)) as CocktailRecipe
      handleUpdateBatch(id, {
        selectedCocktail: cocktail,
        editableRecipe: editableRecipe,
        searchTerm: "",
        servings: defaultServings,
        targetLiters: FIXED_BATCH_LITERS,
      })
    },
    [handleUpdateBatch, defaultServings]
  )

  const handleServingsChange = useCallback(
    (id: number, value: string) => {
      // Allow empty string to clear the input
      if (value === "") {
        handleUpdateBatch(id, { servings: "" })
        return
      }

      const num = parseInt(value, 10)
      // Only update if it's a valid non-negative number
      if (!isNaN(num) && num >= 0) {
        handleUpdateBatch(id, { servings: num })
      }
    },
    [handleUpdateBatch]
  )

  const handleSearchTermChange = useCallback(
    (id: number, term: string) => {
      handleUpdateBatch(id, { searchTerm: term })
    },
    [handleUpdateBatch]
  )

  const handleIngredientChange = useCallback((id: number, newIngredients: Ingredient[]) => {
    setBatches(prev =>
      prev.map(batch => {
        if (batch.id === id) {
          if (batch.editableRecipe) {
            return {
              ...batch,
              editableRecipe: { ...batch.editableRecipe, ingredients: newIngredients },
            }
          }
        }
        return batch
      })
    )
  }, [])

  const handleNameChange = useCallback((id: number, newName: string) => {
    setBatches(prev =>
      prev.map(batch => {
        if (batch.id === id) {
          if (batch.editableRecipe) {
            return {
              ...batch,
              editableRecipe: { ...batch.editableRecipe, name: newName },
            }
          }
        }
        return batch
      })
    )
  }, [])

  const canExport = batches.some(
    b => b.editableRecipe && ((typeof b.servings === "number" && b.servings > 0) || b.targetLiters > 0)
  )

  const generatePdfReport = () => {
    if (!canExport) return

    const reportData = batches.filter(
      b => b.editableRecipe && ((typeof b.servings === "number" && b.servings > 0) || b.targetLiters > 0)
    )
    const grandTotals = calculateGrandTotals(reportData)
    const fixedTargetLiters = FIXED_BATCH_LITERS

    // --- Start HTML for Print Report (Black and White/Simplified) ---
    let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Cocktail Batching Report</title>
                <style>
                    /* Simplified B&W Styles for Print */
                    body { font-family: sans-serif; margin: 0; padding: 20mm; color: #000; background: #fff; }
                    h1, h2, h3, h4 { color: #000; page-break-after: avoid; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                    .batch-section { margin-bottom: 40px; border: 1px solid #000; padding: 20px; page-break-inside: avoid; }
                    .table-container { margin-top: 15px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #000; padding: 8px; text-align: right; }
                    th { text-align: left; background-color: #f0f0f0; }
                    .total-row td { font-weight: bold; background-color: #e0e0e0; }
                    .summary-title { margin-top: 40px; border-bottom: 2px solid #000; padding-bottom: 5px; }
                    .text-left { text-align: left; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Cocktail Batching Production Sheet</h1>
                    <p>Generated on: ${new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}</p>
                </div>
        `

    // 1. Grand Total Summary (Inventory Shopping List)
    htmlContent += `
            <h2 class="summary-title">Inventory Shopping List (Grand Totals based on Servings)</h2>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th class="text-left">INGREDIENT</th>
                            <th>Total ML (Rounded UP)</th>
                            <th>Total Quarts (Q)</th>
                            <th>Approx. @750 BOTTLES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${grandTotals
                          .map(
                            ing => `
                            <tr class="total-row">
                                <td class="text-left">${ing.name}</td>
                                <td>${formatMLValue(ing.ml)}</td>
                                <td>${formatNumber(ing.quart)}</td>
                                <td>${formatNumber(ing.bottles)}</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        `

    // 2. Individual Batch Sections
    htmlContent += `<h2 class="summary-title" style="margin-top: 50px;">Individual Batch Sheets</h2>`

    reportData.forEach(batch => {
      if (!batch.editableRecipe) return

      const recipe = batch.editableRecipe
      const servingsNum =
        typeof batch.servings === "number"
          ? batch.servings
          : batch.servings === ""
          ? 0
          : parseInt(batch.servings, 10) || 0

      const singleServingVolumeML = calculateSingleServingLiquidVolumeML(recipe)
      const twentyLiterML = fixedTargetLiters * LITER_TO_ML

      // Calculate for Servings Batch (if valid)
      const servingsBatchIngredients =
        servingsNum > 0
          ? recipe.ingredients.map(item => {
              const batchResult = calculateBatch(servingsNum, item.amount)
              return { name: item.name, singleAmount: item.amount, ...batchResult }
            })
          : []
      const totalServingsLiquidML = servingsBatchIngredients.reduce((sum, ing) => sum + ing.ml, 0)

      // Calculate for Fixed 20L Target Liter Batch (if valid)
      const targetBatchIngredients =
        singleServingVolumeML > 0
          ? recipe.ingredients.map(item => {
              const { baseAmount, unit, type } = parseAmount(item.amount)

              if (type !== "liquid") {
                return {
                  name: item.name,
                  singleAmount: item.amount,
                  unitType: type,
                  originalUnit: unit,
                  ml: 0,
                  quart: 0,
                  bottles: 0,
                }
              }

              const ingredientML = baseAmount * (CONVERSION_FACTORS[unit] || 0)
              const proportion = ingredientML / singleServingVolumeML
              const fixedTargetML = fixedTargetLiters * LITER_TO_ML
              const finalML = fixedTargetML * proportion

              return {
                name: item.name,
                singleAmount: item.amount,
                unitType: "liquid",
                originalUnit: unit,
                ml: finalML,
                quart: finalML / QUART_TO_ML,
                bottles: finalML / BOTTLE_SIZE_ML,
              }
            })
          : []

      htmlContent += `
                <div class="batch-section">
                    <h3>Cocktail: ${recipe.name} (Batch #${batch.id})</h3>
                    <p><strong>1-Serving Liquid Volume:</strong> ${formatNumber(singleServingVolumeML)} ML</p>
                    <p style="margin-top: 10px;"><strong>Garnish:</strong> ${recipe.garnish || "N/A"}</p>
                    <p><strong>Method:</strong> ${recipe.method || "N/A"}</p>

                    <h4 style="margin-top: 20px;">Ingredient Amounts</h4>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th class="text-left">INGREDIENT</th>
                                    <th>1 Serving</th>
                                    ${servingsNum > 0 ? `<th>${servingsNum} SERVINGS (ML) (Rounded UP)</th>` : ""}
                                    ${
                                      totalServingsLiquidML > twentyLiterML && singleServingVolumeML > 0
                                        ? `<th>${fixedTargetLiters} LITER BATCH (ML) (Rounded UP)</th>`
                                        : ""
                                    }
                                </tr>
                            </thead>
                            <tbody>
                                ${recipe.ingredients
                                  .map((item, index) => {
                                    const servingsCalc = servingsBatchIngredients[index]
                                    const targetCalc = targetBatchIngredients[index]
                                    const { type } = parseAmount(item.amount)

                                    const servingsData = servingsCalc
                                      ? type === "liquid"
                                        ? formatMLValue(servingsCalc.ml)
                                        : type === "count"
                                        ? `${formatNumber(servingsCalc.ml, 0)} ${servingsCalc.originalUnit}`
                                        : servingsCalc.originalUnit
                                      : "N/A"

                                    const targetData = targetCalc
                                      ? type === "liquid"
                                        ? formatMLValue(targetCalc.ml)
                                        : "N/A (Liquid Only)"
                                      : "N/A"

                                    return `<tr>
                                        <td class="text-left">${item.name}</td>
                                        <td>${item.amount}</td>
                                        ${servingsNum > 0 ? `<td>${servingsData}</td>` : ""}
                                        ${
                                          totalServingsLiquidML > twentyLiterML && singleServingVolumeML > 0
                                            ? `<td>${targetData}</td>`
                                            : ""
                                        }
                                    </tr>`
                                  })
                                  .join("")}
                            </tbody>
                        </table>
                    </div>
                    
                    ${
                      servingsNum > 0
                        ? `<p style="margin-top: 15px;">Total Volume for ${servingsNum} Servings: <strong>${formatNumber(
                            totalServingsLiquidML / LITER_TO_ML
                          )} L</strong></p>`
                        : ""
                    }
                </div>
            `
    })

    htmlContent += `</body></html>`

    // Open a new window and print the content
    const newWindow = window.open()
    if (newWindow) {
      newWindow.document.write(htmlContent)
      newWindow.document.close()
      newWindow.focus()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans py-1 sm:py-2 px-0">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 flex items-center border-b border-gray-300 pb-2 px-0">
          <Wine className="w-10 h-10 mr-3 text-orange-600" />
          Batch Calculator
        </h1>

        <div className="space-y-6 sm:space-y-8 mb-4">
          {/* Render all independent cocktail batch slots */}
          {batches.map(batch => (
            <BatchItem
              key={batch.id}
              batch={batch}
              onSelect={handleSelectCocktail}
              onServingsChange={handleServingsChange}
              onSearchTermChange={handleSearchTermChange}
              onIngredientChange={handleIngredientChange}
              onNameChange={handleNameChange}
              onRemove={handleRemoveBatch}
              isOnlyItem={batches.length === 1}
            />
          ))}
        </div>

        {/* "Add New" Button */}
        <div className="mt-4 pt-3 border-t border-gray-300 px-0">
          <button
            onClick={handleAddBatch}
            className={`w-full py-4 text-xl font-bold rounded-xl transition duration-300 shadow-lg uppercase tracking-widest flex items-center justify-center space-x-3 
                            bg-gray-200 hover:bg-gray-300 border border-gray-400 text-gray-800`}
          >
            <PlusCircle className="w-6 h-6 text-orange-600" />
            <span>Add New Cocktail Slot</span>
          </button>
        </div>

        {/* Final Export Button */}
        <div className="mt-3 space-y-3 px-0">
          <button
            className={`w-full py-4 text-xl font-bold rounded-xl transition duration-300 shadow-xl uppercase tracking-widest
                            ${
                              canExport
                                ? "bg-orange-600 text-white border border-orange-700 hover:bg-orange-700 shadow-orange-600/30"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                            }`}
            onClick={generatePdfReport}
            disabled={!canExport}
          >
            Download All Batch Sheets (Print-Ready PDF)
          </button>
        </div>
      </div>
    </div>
  )
}
