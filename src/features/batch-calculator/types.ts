// --- TYPE DEFINITIONS ---

export interface Ingredient {
  name: string
  amount: string
  unit?: string
  preferredUnit?: string
}

export type CocktailMethod = "Shake" | "Build"

export type GlassType = "Rocks" | "Coupe" | "Martini" | "Highball" | "Flute" | "Served Up"

export interface CocktailRecipe {
  id?: number  // Database ID (optional for backward compatibility)
  name: string
  method: CocktailMethod
  glassType?: GlassType
  instructions?: string
  ingredients: Ingredient[]
  featured?: boolean
  image?: string
  abv?: number
}

export type UnitType = "liquid" | "count" | "special"

export interface ParsedAmount {
  baseAmount: number
  unit: string
  type: UnitType
}

export interface BatchResult {
  [x: string]: any
  ml: number
  quart: number
  bottles: number
  unitType: UnitType
  originalUnit: string
  singleAmount?: string // Used internally for combined ingredients
}

export interface BatchState {
  id: number
  selectedCocktail: CocktailRecipe | null
  editableRecipe: CocktailRecipe | null
  servings: number | ""
  targetLiters: number // Fixed to 20L
}

export interface CombinedIngredient extends Ingredient {
  isLiquid: boolean
  isCount: boolean
  isSpecial: boolean
  servings: BatchResult
  target: BatchResult
}

export interface BatchResultWithCans extends BatchResult {
  cans12oz?: number
  bottles4oz?: number
  preferredUnit?: string
  preferredUnitValue?: number | null
}

