// --- TYPE DEFINITIONS ---

export interface Ingredient {
  name: string
  amount: string
}

export interface CocktailRecipe {
  name: string
  garnish: string
  method: string
  ingredients: Ingredient[]
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
  searchTerm: string
}

