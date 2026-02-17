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
    const { name, method, instructions, ingredients, category, tags, featured, glassType, season } = body

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
    if (glassType !== undefined) updateData.glassType = glassType
    if (method !== undefined) {
      // Validate method is either "Shake" or "Build"
      if (method !== 'Shake' && method !== 'Build') {
        return NextResponse.json(
          { error: 'Method must be either "Shake" or "Build"' },
          { status: 400 }
        )
      }
      updateData.method = method
    }
    if (instructions !== undefined) updateData.instructions = instructions || null
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
        unit: ing.unit || undefined,
        preferredUnit: ing.preferredUnit || undefined,
      }))
    }
    if (category !== undefined) updateData.category = category
    if (tags !== undefined) updateData.tags = tags
    if (featured !== undefined) updateData.featured = featured
    if (season !== undefined) updateData.season = season

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

    // Get password from request body
    const body = await request.json().catch(() => ({}))
    const { password } = body

    // Validate password
    const requiredPassword = process.env.DELETE_RECIPE_PASSWORD
    if (!requiredPassword) {
      console.error('DELETE_RECIPE_PASSWORD environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (!password || password !== requiredPassword) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
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
