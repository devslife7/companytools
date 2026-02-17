
import 'dotenv/config'
import { prisma } from '../src/lib/db/prisma'
import { COCKTAIL_DATA } from '../src/features/batch-calculator/data/cocktails'

async function main() {
    console.log('🖼️  Starting image update...')

    let updatedCount = 0
    let skippedCount = 0

    for (const cocktail of COCKTAIL_DATA) {
        if (!cocktail.image) {
            console.log(`⚠️  Skipping ${cocktail.name} (no image)`)
            skippedCount++
            continue
        }

        try {
            // Find the cocktail by name to get its ID in the DB (IDs might differ from local data)
            const existing = await prisma.cocktail.findUnique({
                where: { name: cocktail.name }
            })

            if (existing) {
                await prisma.cocktail.update({
                    where: { id: existing.id },
                    data: { image: cocktail.image }
                })
                console.log(`✅ Updated: ${cocktail.name} -> ${cocktail.image}`)
                updatedCount++
            } else {
                console.log(`❌ Not found in DB: ${cocktail.name}`)
                skippedCount++
            }
        } catch (error) {
            console.error(`❌ Error updating ${cocktail.name}:`, error)
            skippedCount++
        }
    }

    console.log(`\n🎉 Update completed!`)
    console.log(`   Updated: ${updatedCount}`)
    console.log(`   Skipped: ${skippedCount}`)
}

main()
    .catch((e) => {
        console.error('❌ Script failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
