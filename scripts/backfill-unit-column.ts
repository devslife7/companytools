import 'dotenv/config'
import { prisma } from '../src/lib/db/prisma'
import { parseAmount } from '../src/features/batch-calculator/lib/calculations'

/**
 * Normalize parsed unit to one of the standard unit values: oz, dash, tsp, each
 */
function normalizeUnit(parsed: { unit: string; type: string }): string | null {
  const unitLower = parsed.unit.toLowerCase().trim()
  const type = parsed.type

  // Handle special cases
  if (unitLower === 'n/a' || unitLower === 'top' || parsed.type === 'special') {
    // For special values, default to "oz"
    return 'oz'
  }

  // Handle count items
  if (type === 'count' || unitLower.includes('each')) {
    return 'each'
  }

  // Normalize liquid units
  if (unitLower.startsWith('oz') || unitLower === 'ounce' || unitLower === 'ounces') {
    return 'oz'
  }

  if (unitLower.startsWith('dash') || unitLower === 'dashes') {
    return 'dash'
  }

  if (unitLower.startsWith('tsp') || unitLower === 'teaspoon' || unitLower === 'teaspoons') {
    return 'tsp'
  }

  // If we have a unit but it's not recognized, check if it's a count item
  if (unitLower && unitLower !== 'count' && unitLower !== 'n/a') {
    // Check for common count indicators
    const countKeywords = ['leaf', 'leaves', 'sprig', 'sprigs', 'slice', 'slices', 'bean', 'beans', 'piece', 'pieces']
    if (countKeywords.some(keyword => unitLower.includes(keyword))) {
      return 'each'
    }
  }

  // Default fallback to "oz" for unrecognized units
  return 'oz'
}

/**
 * Extract and normalize unit from amount string
 */
function extractUnitFromAmount(amount: string | null): string | null {
  if (!amount || amount.trim() === '') {
    return 'oz' // Default for empty amounts
  }

  try {
    const parsed = parseAmount(amount)
    return normalizeUnit(parsed)
  } catch (error) {
    console.error(`Error parsing amount "${amount}":`, error)
    return 'oz' // Default fallback on error
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  
  console.log('🔄 Starting unit column backfill...')
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made')
  }

  try {
    // Fetch all ingredients where unit is NULL
    const ingredients = await prisma.ingredient.findMany({
      where: {
        unit: null,
      },
      select: {
        id: true,
        name: true,
        amount: true,
      },
      orderBy: {
        id: 'asc',
      },
    })

    console.log(`📊 Found ${ingredients.length} ingredients with NULL unit`)

    if (ingredients.length === 0) {
      console.log('✅ No ingredients to update. All units are already populated.')
      return
    }

    // Process ingredients and collect updates
    const updates: Array<{ id: number; unit: string }> = []
    const stats = {
      oz: 0,
      dash: 0,
      tsp: 0,
      each: 0,
      errors: 0,
    }

    for (const ingredient of ingredients) {
      const normalizedUnit = extractUnitFromAmount(ingredient.amount)
      
      if (normalizedUnit) {
        updates.push({
          id: ingredient.id,
          unit: normalizedUnit,
        })
        
        // Update stats
        stats[normalizedUnit as keyof typeof stats]++
        
        if (!dryRun) {
          console.log(`  ✓ ${ingredient.name}: "${ingredient.amount}" → unit: "${normalizedUnit}"`)
        } else {
          console.log(`  [DRY RUN] ${ingredient.name}: "${ingredient.amount}" → unit: "${normalizedUnit}"`)
        }
      } else {
        stats.errors++
        console.warn(`  ⚠️  ${ingredient.name}: "${ingredient.amount}" → Could not determine unit`)
      }
    }

    // Show summary
    console.log('\n📈 Summary:')
    console.log(`  oz: ${stats.oz}`)
    console.log(`  dash: ${stats.dash}`)
    console.log(`  tsp: ${stats.tsp}`)
    console.log(`  each: ${stats.each}`)
    if (stats.errors > 0) {
      console.log(`  errors: ${stats.errors}`)
    }

    if (dryRun) {
      console.log('\n⚠️  DRY RUN - No changes were made. Run without --dry-run to apply changes.')
      return
    }

    // Update ingredients in batches
    console.log('\n💾 Updating database...')
    let updatedCount = 0

    // Use individual updates for better error tracking
    for (const update of updates) {
      try {
        await prisma.ingredient.update({
          where: { id: update.id },
          data: { unit: update.unit },
        })
        updatedCount++
      } catch (error) {
        console.error(`  ❌ Failed to update ingredient ID ${update.id}:`, error)
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} out of ${updates.length} ingredients`)
    
    // Verify the update
    const remainingNull = await prisma.ingredient.count({
      where: { unit: null },
    })
    
    if (remainingNull > 0) {
      console.log(`⚠️  Warning: ${remainingNull} ingredients still have NULL unit`)
    } else {
      console.log('✅ All ingredients now have a unit value')
    }
  } catch (error) {
    console.error('❌ Backfill failed:', error)
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
