import 'dotenv/config'
import { prisma } from '../src/lib/db/prisma'
import { calculateCocktailABV } from "../src/features/batch-calculator/lib/abv"
import type { Ingredient } from "../src/features/batch-calculator/types"

async function main() {
    console.log("Starting ABV calculation update...")

    try {
        const cocktails = await prisma.cocktail.findMany({
            include: {
                ingredients: true,
            },
        })

        console.log(`Found ${cocktails.length} cocktails to process.`)

        let updatedCount = 0

        for (const cocktail of cocktails) {
            // Map Prisma ingredients to the Ingredient interface expected by calculateCocktailABV
            const mappedIngredients: Ingredient[] = cocktail.ingredients.map(ing => ({
                name: ing.name,
                amount: ing.amount.toString(),
                unit: ing.unit || undefined,
                preferredUnit: ing.preferredUnit || undefined,
            }))

            const abv = calculateCocktailABV(mappedIngredients)

            // Get current ABV, treating null as distinct from 0
            const currentAbv = cocktail.abv

            // Check if update is needed
            // If current is null, or if different from calculated (allow small float diff)
            const needsUpdate = currentAbv === null || Math.abs(currentAbv - abv) > 0.1

            if (needsUpdate) {
                await prisma.cocktail.update({
                    where: { id: cocktail.id },
                    data: { abv },
                })
                console.log(`Updated "${cocktail.name}": ${currentAbv ?? 'null'}% -> ${abv}%`)
                updatedCount++
            }
        }

        console.log(`\nSuccess! Updated ${updatedCount} cocktails.`)
    } catch (error) {
        console.error("Error updating ABVs:", error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
