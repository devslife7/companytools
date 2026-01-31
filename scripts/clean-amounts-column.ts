import 'dotenv/config'
import { prisma } from '../src/lib/db/prisma'
import { parseAmount } from '../src/features/batch-calculator/lib/calculations'

/**
 * Extract numeric value from amount string
 * Returns the baseAmount as a string (for now, before schema change to Decimal)
 */
function extractNumericAmount(amount: string | null): string {
  if (!amount || amount.trim() === '') {
    return '0'
  }

  try {
    const parsed = parseAmount(amount)
    
    // Handle special values - convert to 0
    if (parsed.type === 'special' || parsed.baseAmount === 0) {
      return '0'
    }
    
    // Return the numeric value as a string
    // Format to handle decimals properly (remove trailing zeros)
    const numStr = parsed.baseAmount.toString()
    // Remove trailing zeros and unnecessary decimal point
    return numStr.replace(/\.0+$/, '').replace(/\.(\d*?)0+$/, '.$1').replace(/\.$/, '') || '0'
  } catch (error) {
    console.error(`Error parsing amount "${amount}":`, error)
    return '0' // Default fallback on error
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  
  console.log('🔄 Starting amounts column cleanup...')
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made')
  }

  try {
    // Fetch all ingredients
    const ingredients = await prisma.ingredient.findMany({
      select: {
        id: true,
        name: true,
        amount: true,
        unit: true,
      },
      orderBy: {
        id: 'asc',
      },
    })

    console.log(`📊 Found ${ingredients.length} ingredients to process`)

    if (ingredients.length === 0) {
      console.log('✅ No ingredients to update.')
      return
    }

    // Process ingredients and collect updates
    const updates: Array<{ id: number; oldAmount: string; newAmount: string }> = []
    const stats = {
      updated: 0,
      unchanged: 0,
      errors: 0,
      specialToZero: 0,
    }

    for (const ingredient of ingredients) {
      // Handle both string (before schema change) and Decimal (after schema change)
      const oldAmount = typeof ingredient.amount === 'string' 
        ? ingredient.amount 
        : ingredient.amount?.toString() || ''
      const newAmount = extractNumericAmount(oldAmount)
      
      // Check if amount needs updating
      if (oldAmount === newAmount) {
        stats.unchanged++
        continue
      }
      
      // Track special value conversions
      const parsed = parseAmount(oldAmount)
      if (parsed.type === 'special' || parsed.baseAmount === 0) {
        stats.specialToZero++
      }
      
      updates.push({
        id: ingredient.id,
        oldAmount,
        newAmount,
      })
      
      if (!dryRun) {
        console.log(`  ✓ ${ingredient.name}: "${oldAmount}" → "${newAmount}"`)
      } else {
        console.log(`  [DRY RUN] ${ingredient.name}: "${oldAmount}" → "${newAmount}"`)
      }
    }

    // Show summary
    console.log('\n📈 Summary:')
    console.log(`  Total ingredients: ${ingredients.length}`)
    console.log(`  To be updated: ${updates.length}`)
    console.log(`  Unchanged: ${stats.unchanged}`)
    console.log(`  Special values converted to 0: ${stats.specialToZero}`)
    if (stats.errors > 0) {
      console.log(`  Errors: ${stats.errors}`)
    }

    if (dryRun) {
      console.log('\n⚠️  DRY RUN - No changes were made. Run without --dry-run to apply changes.')
      return
    }

    // Update ingredients
    console.log('\n💾 Updating database...')
    let updatedCount = 0

    // Use individual updates for better error tracking
    for (const update of updates) {
      try {
        await prisma.ingredient.update({
          where: { id: update.id },
          data: { amount: update.newAmount },
        })
        updatedCount++
      } catch (error) {
        stats.errors++
        console.error(`  ❌ Failed to update ingredient ID ${update.id} (${update.oldAmount} → ${update.newAmount}):`, error)
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} out of ${updates.length} ingredients`)
    
    if (stats.errors > 0) {
      console.log(`⚠️  Warning: ${stats.errors} ingredients failed to update`)
    } else {
      console.log('✅ All ingredients updated successfully')
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
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
