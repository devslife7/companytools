import 'dotenv/config'
import { prisma } from '../src/lib/db/prisma'
import { COCKTAIL_DATA } from '../src/features/batch-calculator/data/cocktails'

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...')
  await prisma.ingredient.deleteMany()
  await prisma.cocktail.deleteMany()

  // Seed cocktails
  console.log(`📝 Seeding ${COCKTAIL_DATA.length} cocktails...`)

  for (const cocktail of COCKTAIL_DATA) {
    // Convert method to enum: case-insensitive match for "Shake"/"Shaken", default to "Build"
    const methodLower = cocktail.method?.toLowerCase().trim()
    const methodValue = (methodLower === 'shaken' || methodLower === 'shake') ? 'Shake' : 'Build'

    await prisma.cocktail.create({
      data: {
        name: cocktail.name,
        method: methodValue,
        instructions: cocktail.instructions || null,
        isActive: true,
        featured: cocktail.featured || false,
        image: cocktail.image || null,
        ingredients: {
          create: cocktail.ingredients.map((ingredient, index) => ({
            name: ingredient.name,
            amount: ingredient.amount,
            orderIndex: index,
          })),
        },
      },
    })
    console.log(`  ✓ Created: ${cocktail.name}`)
  }

  console.log('✅ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
