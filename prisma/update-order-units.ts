import 'dotenv/config'
import { prisma } from '../src/lib/db/prisma'
import { COCKTAIL_DATA } from '../src/features/batch-calculator/data/cocktails'

async function main() {
    console.log('🔄 Starting order unit update...')

    let updatedCount = 0
    let skippedCount = 0

    for (const cocktail of COCKTAIL_DATA) {
        const dbCocktail = await prisma.cocktail.findUnique({
            where: { name: cocktail.name },
            include: { ingredients: true },
        })

        if (!dbCocktail) {
            console.log(`⚠️ Cocktail not found in DB: ${cocktail.name}`)
            continue
        }

        console.log(`Processing ${cocktail.name}...`)

        for (const ingredient of cocktail.ingredients) {
            if (!ingredient.orderUnit) continue

            const dbIngredient = dbCocktail.ingredients.find(
                (i) => i.name.toLowerCase() === ingredient.name.toLowerCase()
            )

            if (dbIngredient) {
                if (dbIngredient.orderUnit !== ingredient.orderUnit) {
                    await prisma.ingredient.update({
                        where: { id: dbIngredient.id },
                        data: { orderUnit: ingredient.orderUnit },
                    })
                    console.log(
                        `  ✓ Updated ${ingredient.name}: ${ingredient.orderUnit}`
                    )
                    updatedCount++
                } else {
                    // console.log(`  - Skipped ${ingredient.name}: already up to date`)
                }
            } else {
                console.log(
                    `  ⚠️ Ingredient not found in DB: ${ingredient.name} (for ${cocktail.name})`
                )
                skippedCount++
            }
        }
    }

    console.log('✅ Update completed!')
    console.log(`Updated: ${updatedCount} ingredients`)
    console.log(`Skipped/Not Found: ${skippedCount} ingredients`)
}

main()
    .catch((e) => {
        console.error('❌ Update failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
