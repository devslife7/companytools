import { prisma } from './prisma'
import type { CocktailRecipe, CocktailMethod, GlassType } from '@/features/batch-calculator/types'
import { Prisma } from '@prisma/client'

/**
 * Convert Prisma Decimal to string for TypeScript interface compatibility
 */
function decimalToString(value: Prisma.Decimal | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '0'
  }
  if (typeof value === 'string') {
    return value
  }
  // Prisma Decimal type - convert to string
  return value.toString()
}

/**
 * Convert string to Prisma Decimal for database storage
 */
function stringToDecimal(value: string | number | null | undefined): Prisma.Decimal {
  if (value === null || value === undefined || value === '') {
    return new Prisma.Decimal(0)
  }
  if (typeof value === 'number') {
    return new Prisma.Decimal(value)
  }
  // Parse string to number, then create Decimal
  const num = parseFloat(value)
  if (isNaN(num)) {
    return new Prisma.Decimal(0)
  }
  return new Prisma.Decimal(num)
}

/**
 * Transform Prisma cocktail model to CocktailRecipe type
 */
function transformCocktailToRecipe(cocktail: {
  id: number
  name: string
  method: CocktailMethod | string
  instructions?: string | null
  glass?: string | null
  featured: boolean
  image?: string | null
  ingredients: Array<{
    name: string
    amount: Prisma.Decimal | string
    orderIndex: number
    unit?: string | null
    preferredUnit?: string | null
  }>
}): CocktailRecipe {
  // Ensure method is a valid CocktailMethod (fallback to Build if invalid)
  const validMethod: CocktailMethod =
    cocktail.method === 'Shake' || cocktail.method === 'Build'
      ? cocktail.method as CocktailMethod
      : 'Build'

  return {
    id: cocktail.id,  // Include database ID
    name: cocktail.name,
    method: validMethod,
    ...(cocktail.glass && { glassType: cocktail.glass as GlassType }),
    ...(cocktail.instructions && { instructions: cocktail.instructions }),
    featured: cocktail.featured,
    ...(cocktail.image && { image: cocktail.image }),
    ingredients: cocktail.ingredients
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(ing => ({
        name: ing.name,
        amount: decimalToString(ing.amount),
        ...(ing.unit != null && ing.unit !== '' && { unit: ing.unit }),
        ...(ing.preferredUnit != null && ing.preferredUnit !== '' && { preferredUnit: ing.preferredUnit }),
      })),
  }
}

/**
 * Get all cocktails with optional filters
 */
export async function getAllCocktails(filters?: {
  search?: string
  category?: string
  active?: boolean
  featured?: boolean
  liquor?: string
}): Promise<CocktailRecipe[]> {
  try {
    const where: any = {}

    if (filters?.active !== undefined) {
      where.isActive = filters.active
    } else {
      where.isActive = true // Default to active only
    }

    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.featured !== undefined) {
      where.featured = filters.featured
    }

    if (filters?.search) {
      where.name = {
        contains: filters.search,
        mode: 'insensitive',
      }
    }

    if (filters?.liquor) {
      where.ingredients = {
        some: {
          name: {
            contains: filters.liquor,
            mode: 'insensitive',
          },
        },
      }
    }

    const cocktails = await prisma.cocktail.findMany({
      where,
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

    return cocktails.map(transformCocktailToRecipe)
  } catch (error) {
    console.error('Database error in getAllCocktails:', error)

    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack
      })

      // Check for specific Prisma errors
      if ((error as any).code) {
        console.error('Prisma error code:', (error as any).code)
      }
    }

    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Database query failed: ${error.message}`)
    }
    throw error
  }
}

/**
 * Get a single cocktail by ID
 */
export async function getCocktailById(id: number): Promise<CocktailRecipe | null> {
  const cocktail = await prisma.cocktail.findUnique({
    where: { id },
    include: {
      ingredients: {
        orderBy: {
          orderIndex: 'asc',
        },
      },
    },
  })

  if (!cocktail) return null

  return transformCocktailToRecipe(cocktail)
}

/**
 * Get a single cocktail by name
 */
export async function getCocktailByName(name: string): Promise<CocktailRecipe | null> {
  const cocktail = await prisma.cocktail.findUnique({
    where: { name },
    include: {
      ingredients: {
        orderBy: {
          orderIndex: 'asc',
        },
      },
    },
  })

  if (!cocktail) return null

  return transformCocktailToRecipe(cocktail)
}

/**
 * Create a new cocktail
 */
export async function createCocktail(
  data: Omit<CocktailRecipe, 'id'> & {
    category?: string
    tags?: string[]
    createdBy?: string
  }
): Promise<CocktailRecipe> {
  const cocktail = await prisma.cocktail.create({
    data: {
      name: data.name,
      method: data.method,
      instructions: data.instructions || null,
      glass: data.glassType || null,
      category: data.category,
      tags: data.tags || [],
      createdBy: data.createdBy,
      featured: data.featured ?? false,
      image: data.image || null,
      ingredients: {
        create: data.ingredients.map((ing, index) => ({
          name: ing.name,
          amount: stringToDecimal(ing.amount),
          orderIndex: index,
          unit: ing.unit || null,
          preferredUnit: ing.preferredUnit || null,
        })),
      },
    },
    include: {
      ingredients: {
        orderBy: {
          orderIndex: 'asc',
        },
      },
    },
  })

  return transformCocktailToRecipe(cocktail)
}

/**
 * Update an existing cocktail
 */
export async function updateCocktail(
  id: number,
  data: Partial<CocktailRecipe> & {
    category?: string
    tags?: string[]
  }
): Promise<CocktailRecipe> {
  // If ingredients are being updated, we need to replace them
  if (data.ingredients) {
    // Delete existing ingredients
    await prisma.ingredient.deleteMany({
      where: { cocktailId: id },
    })

    // Create new ingredients
    await prisma.ingredient.createMany({
      data: data.ingredients.map((ing, index) => ({
        cocktailId: id,
        name: ing.name,
        amount: stringToDecimal(ing.amount),
        orderIndex: index,
        unit: ing.unit || null,
        preferredUnit: ing.preferredUnit || null,
      })),
    })
  }

  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.method !== undefined) updateData.method = data.method
  if (data.instructions !== undefined) updateData.instructions = data.instructions || null
  if (data.glassType !== undefined) updateData.glass = data.glassType || null
  if (data.category !== undefined) updateData.category = data.category
  if (data.tags !== undefined) updateData.tags = data.tags
  if (data.featured !== undefined) updateData.featured = data.featured
  if (data.image !== undefined) updateData.image = data.image || null

  // Only update cocktail if there are fields to update (ingredients are handled separately above)
  if (Object.keys(updateData).length > 0) {
    await prisma.cocktail.update({
      where: { id },
      data: updateData,
    })
  }

  // Fetch the updated cocktail
  const cocktail = await prisma.cocktail.findUnique({
    where: { id },
    include: {
      ingredients: {
        orderBy: {
          orderIndex: 'asc',
        },
      },
    },
  })

  if (!cocktail) {
    throw new Error('Cocktail not found after update')
  }

  return transformCocktailToRecipe(cocktail)
}

/**
 * Delete a cocktail
 */
export async function deleteCocktail(id: number): Promise<void> {
  await prisma.cocktail.delete({
    where: { id },
  })
}

/**
 * Search cocktails by name or ingredients
 */
export async function searchCocktails(query: string): Promise<CocktailRecipe[]> {
  const cocktails = await prisma.cocktail.findMany({
    where: {
      isActive: true,
      OR: [
        {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          ingredients: {
            some: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
        },
      ],
    },
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

  return cocktails.map(transformCocktailToRecipe)
}

/**
 * Get unique liquors/spirits from all cocktails
 */
export async function getUniqueLiquors(): Promise<string[]> {
  try {
    const cocktails = await prisma.cocktail.findMany({
      where: {
        isActive: true,
      },
      include: {
        ingredients: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    })

    // Common liquors/spirits keywords to look for
    const liquorKeywords = [
      'vodka', 'bourbon', 'whiskey', 'whisky', 'rye', 'gin', 'rum', 'tequila',
      'pisco', 'brandy', 'cognac', 'prosecco', 'champagne', 'wine', 'cider',
      'mezcal', 'scotch', 'irish', 'japanese', 'liqueur', 'sake', 'vermouth',
      'aperol', 'campari', 'amaretto', 'baileys', 'kahlua', 'curacao'
    ]

    const foundLiquors = new Set<string>()

    cocktails.forEach(cocktail => {
      cocktail.ingredients.forEach(ingredient => {
        const ingredientNameLower = ingredient.name.toLowerCase()
        // Check if ingredient name contains any liquor keyword
        const hasLiquorKeyword = liquorKeywords.some(keyword =>
          ingredientNameLower.includes(keyword)
        )

        if (hasLiquorKeyword) {
          // Add the ingredient name as-is (preserving original capitalization)
          foundLiquors.add(ingredient.name)
        }
      })
    })

    // Sort and return unique liquors
    return Array.from(foundLiquors).sort()
  } catch (error) {
    console.error('Database error in getUniqueLiquors:', error)
    throw error
  }
}
