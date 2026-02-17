import 'dotenv/config'
import { prisma } from '../src/lib/db/prisma'
import { writeFileSync } from 'fs'
import { join } from 'path'
import type { CocktailRecipe, CocktailMethod } from '../src/features/batch-calculator/types'

/**
 * Format a cocktail recipe as TypeScript object literal
 */
function formatCocktail(cocktail: CocktailRecipe, index: number, total: number): string {
  const lines: string[] = []

  // Opening brace
  lines.push('  {')

  // ID (if exists)
  if (cocktail.id !== undefined) {
    lines.push(`    id: ${cocktail.id},`)
  }

  // Name
  lines.push(`    name: ${JSON.stringify(cocktail.name)},`)

  // Method
  if (cocktail.method.includes('\n') || cocktail.method.length > 20) {
    // Multi-line method
    lines.push(`    method:`)
    lines.push(`      ${JSON.stringify(cocktail.method)},`)
  } else {
    lines.push(`    method: ${JSON.stringify(cocktail.method)},`)
  }

  // Instructions (if exists)
  if (cocktail.instructions) {
    lines.push(`    instructions: ${JSON.stringify(cocktail.instructions)},`)
  }

  // Featured (if true)
  if (cocktail.featured) {
    lines.push(`    featured: true,`)
  }

  // ABV (if exists)
  if (cocktail.abv !== undefined && cocktail.abv !== null) {
    lines.push(`    abv: ${cocktail.abv},`)
  }

  // Glass type (if set)
  if (cocktail.glassType) {
    lines.push(`    glassType: ${JSON.stringify(cocktail.glassType)},`)
  }

  // Season (if set)
  if (cocktail.season) {
    lines.push(`    season: ${JSON.stringify(cocktail.season)},`)
  }

  // Image (if set)
  if (cocktail.image) {
    lines.push(`    image: ${JSON.stringify(cocktail.image)},`)
  }

  // Tags (if set and not empty)
  if (cocktail.tags && cocktail.tags.length > 0) {
    lines.push(`    tags: ${JSON.stringify(cocktail.tags)},`)
  }

  // Category (if set)
  if (cocktail.category) {
    lines.push(`    category: ${JSON.stringify(cocktail.category)},`)
  }

  // Ingredients
  lines.push('    ingredients: [')
  cocktail.ingredients.forEach((ing, ingIndex) => {
    const isLast = ingIndex === cocktail.ingredients.length - 1
    const parts: string[] = [`name: ${JSON.stringify(ing.name)}`, `amount: ${JSON.stringify(ing.amount)}`]

    if (ing.unit) {
      parts.push(`unit: ${JSON.stringify(ing.unit)}`)
    }
    if (ing.orderUnit) {
      parts.push(`orderUnit: ${JSON.stringify(ing.orderUnit)}`)
    }

    lines.push(`      { ${parts.join(', ')} }${isLast ? '' : ','}`)
  })
  lines.push('    ],')

  // Closing brace
  const isLast = index === total - 1
  lines.push(`  }${isLast ? '' : ','}`)

  return lines.join('\n')
}

/**
 * Format the entire COCKTAIL_DATA array
 */
function formatCocktailData(cocktails: CocktailRecipe[]): string {
  const lines: string[] = []

  lines.push('import type { CocktailRecipe } from "../types"')
  lines.push('')
  lines.push('export const COCKTAIL_DATA: CocktailRecipe[] = [')

  cocktails.forEach((cocktail, index) => {
    lines.push(formatCocktail(cocktail, index, cocktails.length))

    // Add blank line between cocktails (except after the last one)
    if (index < cocktails.length - 1) {
      lines.push('')
    }
  })

  lines.push(']')
  lines.push('')

  return lines.join('\n')
}

/**
 * Transform Prisma cocktail to CocktailRecipe
 */
function transformCocktailToRecipe(cocktail: {
  id: number
  name: string
  method: string
  instructions?: string | null
  featured: boolean
  abv?: number | null
  ingredients: Array<{
    name: string
    amount: any // Decimal type from Prisma
    orderIndex: number
    unit?: string | null
    orderUnit?: string | null
  }>
  glass?: string | null
  season?: string | null
  tags?: string[]
  category?: string | null
  image?: string | null
}): CocktailRecipe {
  // Ensure method is a valid CocktailMethod (fallback to Build if invalid)
  const validMethod: CocktailMethod =
    cocktail.method === 'Shake' || cocktail.method === 'Build'
      ? cocktail.method as CocktailMethod
      : 'Build'

  const recipe: CocktailRecipe = {
    id: cocktail.id,
    name: cocktail.name,
    method: validMethod,
    featured: cocktail.featured,
    ingredients: cocktail.ingredients
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(ing => {
        // Convert Decimal to string
        const amountStr = typeof ing.amount === 'string'
          ? ing.amount
          : ing.amount?.toString() || '0'

        const ingredient: any = {
          name: ing.name,
          amount: amountStr,
        }

        if (ing.unit) {
          ingredient.unit = ing.unit
        }
        if (ing.orderUnit) {
          ingredient.orderUnit = ing.orderUnit
        }

        return ingredient
      }),
  }

  if (cocktail.instructions) {
    recipe.instructions = cocktail.instructions
  }

  if (cocktail.abv !== null && cocktail.abv !== undefined) {
    recipe.abv = cocktail.abv
  }

  if (cocktail.glass) {
    recipe.glassType = cocktail.glass as any
  }

  if (cocktail.season) {
    recipe.season = cocktail.season as any
  }

  if (cocktail.tags && cocktail.tags.length > 0) {
    recipe.tags = cocktail.tags
  }

  if (cocktail.category) {
    recipe.category = cocktail.category
  }

  if (cocktail.image) {
    recipe.image = cocktail.image
  }

  return recipe
}

async function main() {
  console.log('🔄 Fetching cocktails from database...')

  try {
    // Fetch all cocktails (including inactive ones)
    const cocktails = await prisma.cocktail.findMany({
      include: {
        ingredients: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    console.log(`📊 Found ${cocktails.length} cocktails in database`)

    // Transform to CocktailRecipe format
    const recipes = cocktails.map(transformCocktailToRecipe)

    // Format as TypeScript
    const formatted = formatCocktailData(recipes)

    // Write to file
    const filePath = join(process.cwd(), 'src/features/batch-calculator/data/cocktails.ts')
    writeFileSync(filePath, formatted, 'utf-8')

    console.log(`✅ Successfully exported ${recipes.length} cocktails to ${filePath}`)
  } catch (error) {
    console.error('❌ Export failed:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
