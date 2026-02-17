import { NextRequest, NextResponse } from 'next/server'
import {
  getAllCocktails,
  createCocktail,
  getUniqueLiquors,
} from '@/lib/db/cocktails'
import type { CocktailRecipe } from '@/features/batch-calculator/types'

// GET /api/cocktails - Get all cocktails
export async function GET(request: NextRequest) {
  try {
    // Verify DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set')
      return NextResponse.json(
        { 
          error: 'Database configuration error',
          details: process.env.NODE_ENV === 'development' ? 'DATABASE_URL is not set' : undefined
        },
        { status: 500 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    
    // Check if requesting unique liquors
    if (searchParams.get('liquors') === 'true') {
      try {
        const liquors = await getUniqueLiquors()
        return NextResponse.json({ liquors })
      } catch (error) {
        console.error('Error fetching liquors:', error)
        // Return empty array on error for liquors (non-critical)
        return NextResponse.json({ liquors: [] })
      }
    }
    
    const search = searchParams.get('search') || undefined
    const category = searchParams.get('category') || undefined
    const active = searchParams.get('active') !== 'false' // Default to true
    const featured = searchParams.get('featured') === 'true' ? true : searchParams.get('featured') === 'false' ? false : undefined
    const liquor = searchParams.get('liquor') || undefined
    const season = searchParams.get('season') || undefined

    const cocktails = await getAllCocktails({
      search,
      category,
      active,
      featured,
      liquor,
      season,
    })

    return NextResponse.json({
      cocktails,
      total: cocktails.length,
    })
  } catch (error) {
    console.error('Error fetching cocktails:', error)
    
    // Log detailed error information for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      
      // Check for common connection errors
      if (error.message.includes('connect') || error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
        console.error('Database connection error detected')
      }
      
      // Check for Prisma client errors
      if (error.message.includes('PrismaClient') || error.message.includes('prisma')) {
        console.error('Prisma client error detected')
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Return error details in production for better debugging (can be removed if security concern)
    return NextResponse.json(
      { 
        error: 'Failed to fetch cocktails',
        details: errorMessage,
        // Include error type for debugging
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      },
      { status: 500 }
    )
  }
}

// POST /api/cocktails - Create a new cocktail
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, method, instructions, ingredients, category, tags, createdBy, featured, glassType, season } = body

    // Validate required fields
    if (!name || !method || !ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, method, ingredients' },
        { status: 400 }
      )
    }

    // Validate method is either "Shake" or "Build"
    if (method !== 'Shake' && method !== 'Build') {
      return NextResponse.json(
        { error: 'Method must be either "Shake" or "Build"' },
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
      method,
      ...(glassType !== undefined && { glassType }),
      ...(instructions !== undefined && { instructions }),
      ...(season !== undefined && { season }),
      ingredients: ingredients.map((ing: any) => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit || undefined,
        orderUnit: ing.orderUnit || undefined,
      })),
    }

    const cocktail = await createCocktail({
      ...cocktailData,
      category,
      tags,
      createdBy,
      featured,
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

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to create cocktail',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
