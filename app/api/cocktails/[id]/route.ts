import { NextRequest, NextResponse } from 'next/server'
import {
  getCocktailById,
  updateCocktail,
  deleteCocktail,
} from '@/lib/db/cocktails'

// GET /api/cocktails/[id] - Get a single cocktail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cocktailId = parseInt(id, 10)

    if (isNaN(cocktailId)) {
      return NextResponse.json(
        { error: 'Invalid cocktail ID' },
        { status: 400 }
      )
    }

    const cocktail = await getCocktailById(cocktailId)

    if (!cocktail) {
      return NextResponse.json(
        { error: 'Cocktail not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(cocktail)
  } catch (error) {
    console.error('Error fetching cocktail:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to fetch cocktail',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

// PUT /api/cocktails/[id] - Update a cocktail
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cocktailId = parseInt(id, 10)

    if (isNaN(cocktailId)) {
      return NextResponse.json(
        { error: 'Invalid cocktail ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, garnish, method, ingredients, category, tags } = body

    // Check if cocktail exists
    const existing = await getCocktailById(cocktailId)
    if (!existing) {
      return NextResponse.json(
        { error: 'Cocktail not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (garnish !== undefined) updateData.garnish = garnish
    if (method !== undefined) updateData.method = method
    if (ingredients !== undefined) {
      if (!Array.isArray(ingredients) || ingredients.length === 0) {
        return NextResponse.json(
          { error: 'Ingredients must be a non-empty array' },
          { status: 400 }
        )
      }
      updateData.ingredients = ingredients.map((ing: any) => ({
        name: ing.name,
        amount: ing.amount,
      }))
    }
    if (category !== undefined) updateData.category = category
    if (tags !== undefined) updateData.tags = tags

    const cocktail = await updateCocktail(cocktailId, updateData)

    return NextResponse.json(cocktail)
  } catch (error: any) {
    console.error('Error updating cocktail:', error)
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A cocktail with this name already exists' },
        { status: 409 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to update cocktail',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE /api/cocktails/[id] - Delete a cocktail
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cocktailId = parseInt(id, 10)

    if (isNaN(cocktailId)) {
      return NextResponse.json(
        { error: 'Invalid cocktail ID' },
        { status: 400 }
      )
    }

    // Check if cocktail exists
    const existing = await getCocktailById(cocktailId)
    if (!existing) {
      return NextResponse.json(
        { error: 'Cocktail not found' },
        { status: 404 }
      )
    }

    await deleteCocktail(cocktailId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cocktail:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to delete cocktail',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
