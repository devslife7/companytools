import { NextRequest, NextResponse } from 'next/server'
import {
  getAllCocktails,
  createCocktail,
} from '@/lib/db/cocktails'
import type { CocktailRecipe } from '@/features/batch-calculator/types'

// GET /api/cocktails - Get all cocktails
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || undefined
    const category = searchParams.get('category') || undefined
    const active = searchParams.get('active') !== 'false' // Default to true

    const cocktails = await getAllCocktails({
      search,
      category,
      active,
    })

    return NextResponse.json({
      cocktails,
      total: cocktails.length,
    })
  } catch (error) {
    console.error('Error fetching cocktails:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cocktails' },
      { status: 500 }
    )
  }
}

// POST /api/cocktails - Create a new cocktail
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, garnish, method, ingredients, category, tags, createdBy } = body

    // Validate required fields
    if (!name || !garnish || !method || !ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, garnish, method, ingredients' },
        { status: 400 }
      )
    }

    // Validate ingredients
    if (ingredients.length === 0) {
      return NextResponse.json(
        { error: 'At least one ingredient is required' },
        { status: 400 }
      )
    }

    const cocktailData: Omit<CocktailRecipe, 'id'> = {
      name,
      garnish,
      method,
      ingredients: ingredients.map((ing: any) => ({
        name: ing.name,
        amount: ing.amount,
      })),
    }

    const cocktail = await createCocktail({
      ...cocktailData,
      category,
      tags,
      createdBy,
    })

    return NextResponse.json(cocktail, { status: 201 })
  } catch (error: any) {
    console.error('Error creating cocktail:', error)
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A cocktail with this name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create cocktail' },
      { status: 500 }
    )
  }
}
