import 'dotenv/config'
import { prisma } from '../src/lib/db/prisma'

async function main() {
    console.log('🔍 Verifying order units...')

    const ingredientsWithOrderUnit = await prisma.ingredient.findMany({
        where: {
            orderUnit: { not: null },
        },
        take: 5,
        include: { cocktail: true },
    })

    if (ingredientsWithOrderUnit.length === 0) {
        console.log('❌ No ingredients found with orderUnit set.')
    } else {
        console.log(`✅ Found ${ingredientsWithOrderUnit.length} sample ingredients with orderUnit:`)
        ingredientsWithOrderUnit.forEach((i) => {
            console.log(`  - ${i.cocktail.name} -> ${i.name}: ${i.orderUnit}`)
        })
    }

    const totalUpdated = await prisma.ingredient.count({
        where: {
            orderUnit: { not: null },
        },
    })
    console.log(`\nTotal ingredients with orderUnit: ${totalUpdated}`)

}

main()
    .catch((e) => {
        console.error('❌ Verification failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
