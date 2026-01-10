import { prisma } from './prisma'
import type { CocktailRecipe } from '@/features/batch-calculator/types'

/**
 * Transform Prisma cocktail model to CocktailRecipe type
 */
function transformCocktailToRecipe(cocktail: {
  id: number
  name: string
  garnish: string
  method: string
  ingredients: {
    name: string
    amount: string
    orderIndex: number
  }[]
}): CocktailRecipe {
  return {
    id: cocktail.id,  // Include database ID
    name: cocktail.name,
    garnish: cocktail.garnish,
    method: cocktail.method,
    ingredients: cocktail.ingredients
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(ing => ({
        name: ing.name,
        amount: ing.amount,
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
}): Promise<CocktailRecipe[]> {
  const where: any = {}

  if (filters?.active !== undefined) {
    where.isActive = filters.active
  } else {
    where.isActive = true // Default to active only
  }

  if (filters?.category) {
    where.category = filters.category
  }

  if (filters?.search) {
    where.name = {
      contains: filters.search,
      mode: 'insensitive',
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
      garnish: data.garnish,
      method: data.method,
      category: data.category,
      tags: data.tags || [],
      createdBy: data.createdBy,
      ingredients: {
        create: data.ingredients.map((ing, index) => ({
          name: ing.name,
          amount: ing.amount,
          orderIndex: index,
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
        amount: ing.amount,
        orderIndex: index,
      })),
    })
  }

  const updateData: any = {}
  if (data.name) updateData.name = data.name
  if (data.garnish) updateData.garnish = data.garnish
  if (data.method) updateData.method = data.method
  if (data.category !== undefined) updateData.category = data.category
  if (data.tags) updateData.tags = data.tags

  const cocktail = await prisma.cocktail.update({
    where: { id },
    data: updateData,
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
