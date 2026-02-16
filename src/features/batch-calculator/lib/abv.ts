import { parseAmount, CONVERSION_FACTORS } from "./calculations"
import type { Ingredient } from "../types"

// Default ABV values for common ingredients
// Values are in percentage (0-100)
export const INGREDIENT_ABV: Record<string, number> = {
    // Spirits (Base)
    "vodka": 40,
    "gin": 40,
    "rum": 40,
    "white rum": 40,
    "dark rum": 40,
    "spiced rum": 35,
    "aged rum": 40,
    "tequila": 40,
    "blanco tequila": 40,
    "reposado tequila": 40,
    "anejo tequila": 40,
    "mezcal": 40,
    "whiskey": 40,
    "whisky": 40,
    "bourbon": 40,
    "rye": 40,
    "scotch": 40,
    "irish whiskey": 40,
    "brandy": 40,
    "cognac": 40,
    "pisco": 40,
    "cachaca": 40,
    "absinthe": 60,

    // Liqueurs & Cordials
    "cointreau": 40,
    "triple sec": 30,
    "grand marnier": 40,
    "blue curacao": 25,
    "curacao": 25,
    "maraschino liqueur": 32,
    "maraschino": 32,
    "amaretto": 28,
    "kahlua": 20,
    "coffee liqueur": 20,
    "baileys": 17,
    "irish cream": 17,
    "campari": 25,
    "aperol": 11,
    "st-germain": 20,
    "elderflower liqueur": 20,
    "green chartreuse": 55,
    "yellow chartreuse": 40,
    "luxardo": 32,
    "benedictine": 40,
    "drambuie": 40,
    "frangelico": 20,
    "chambord": 16,
    "midori": 20,
    "malibu": 21,
    "sloe gin": 26,
    "creme de cacao": 25,
    "creme de menthe": 25,
    "creme de cassis": 15,
    "creme de violette": 22,
    "fernet": 39,
    "fernet branca": 39,
    "amaro": 30,
    "cynar": 16.5,
    "nonino": 35,
    "montenegro": 23,
    "jagermeister": 35,
    "liquor 43": 31,
    "licor 43": 31,
    "galliano": 42,
    "sambuca": 42,
    "limoncello": 30,
    "pear liqueur": 20,
    "cherry heering": 24,

    // Wines & Vermouths
    "vermouth": 16,
    "sweet vermouth": 16,
    "dry vermouth": 18,
    "blanc vermouth": 16,
    "red vermouth": 16,
    "lillet": 17,
    "lillet blanc": 17,
    "cocchi americano": 16,
    "sherry": 18,
    "port": 20,
    "madeira": 19,
    "marsala": 17,
    "wine": 12,
    "red wine": 13,
    "white wine": 12,
    "rose wine": 12,
    "champagne": 12,
    "prosecco": 11,
    "cava": 11,
    "sparkling wine": 12,
    "sake": 15,

    // Bitters (High ABV but small quantity)
    "angostura bitters": 44.7,
    "orange bitters": 39,
    "peychaud's bitters": 35,
    "bitters": 40,

    // Non-alcoholic (explicit 0 to prevent false positive matches like 'ginger' -> 'gin')
    "ginger": 0,
    "ginger beer": 0,
    "ginger ale": 0,
    "ginger syrup": 0,
    "syrup": 0,
    "simple syrup": 0,
    "juice": 0,
    "lemon juice": 0,
    "lime juice": 0,
    "orange juice": 0,
    "grapefruit juice": 0,
    "pineapple juice": 0,
    "cranberry juice": 0,
    "puree": 0,
    "nectar": 0,
    "tea": 0,
    "coffee": 0,
    "water": 0,
    "soda": 0,
    "soda water": 0,
    "tonic": 0,
    "club soda": 0,
    "seltzer": 0,
    "milk": 0,
    "cream": 0,
    "egg": 0,
    "egg white": 0,
    "mint": 0,
    "basil": 0,
    "rosemary": 0,
    "fruit": 0,
    "garnish": 0,
    "ice": 0,
}

// Function to estimate ABV of a single ingredient by name
export const getIngredientABV = (name: string): number => {
    const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "")
    const nName = normalize(name)

    // Direct match
    if (INGREDIENT_ABV[nName] !== undefined) {
        return INGREDIENT_ABV[nName]
    }

    // Iterate to find contains match
    // giving priority to longer matches (e.g. "white rum" over "rum")
    const keys = Object.keys(INGREDIENT_ABV).sort((a, b) => b.length - a.length)

    for (const key of keys) {
        if (nName.includes(key)) {
            return INGREDIENT_ABV[key]
        }
    }

    // Fallbacks for generic terms if not caught above
    if (/\bvodka\b/.test(nName)) return 40
    if (/\bgin\b/.test(nName)) return 40
    if (/\brum\b/.test(nName)) return 40
    if (/\bwhiskey\b/.test(nName) || /\bbourbon\b/.test(nName) || /\brye\b/.test(nName)) return 40
    if (/\btequila\b/.test(nName) || /\bmezcal\b/.test(nName)) return 40
    if (/\bbrandy\b/.test(nName) || /\bcognac\b/.test(nName)) return 40

    if (nName.includes("liqueur")) return 20 // Generic liqueur guess

    return 0
}

export const calculateCocktailABV = (ingredients: Ingredient[]): number => {
    let totalVolumeML = 0
    let totalAlcoholML = 0

    for (const ing of ingredients) {
        // combine amount and unit just like in calculations
        const amountStr = ing.unit ? `${ing.amount} ${ing.unit}` : ing.amount
        const { baseAmount, unit, type } = parseAmount(amountStr)

        // We only care about liquid ingredients for ABV
        // Although some solids might have alcohol (tipsy cherries), usually negligible for total ABV
        if (type === "liquid" || (type === "special" && unit !== "Top")) {
            // handle "dash" or other small units correctly via CONVERSION_FACTORS
            const mlPerUnit = CONVERSION_FACTORS[unit] || 0

            // If unit is unknown (mlPerUnit is 0), and it wasn't valid, we skip. 
            // But wait, if unit is empty or default, calculation might treat it as count.
            // Let's rely on type="liquid" or valid conversion factor.

            if (mlPerUnit > 0) {
                const volume = baseAmount * mlPerUnit
                const abv = getIngredientABV(ing.name)

                totalVolumeML += volume
                totalAlcoholML += volume * (abv / 100)
            }
        }
    }

    if (totalVolumeML === 0) return 0

    return parseFloat(((totalAlcoholML / totalVolumeML) * 100).toFixed(1))
}
