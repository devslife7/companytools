import 'dotenv/config'
import { prisma } from '../src/lib/db/prisma'

const LIQUOR_PRICES = [
  { name: 'Vodka', bottlePrice: 22.00, bottleSizeMl: 750 },
  { name: 'Bourbon', bottlePrice: 28.00, bottleSizeMl: 750 },
  { name: 'Bourbon or Rye', bottlePrice: 28.00, bottleSizeMl: 750 },
  { name: 'White Rum', bottlePrice: 18.00, bottleSizeMl: 750 },
  { name: 'Gin', bottlePrice: 25.00, bottleSizeMl: 750 },
  { name: 'Tequila (Reposado)', bottlePrice: 30.00, bottleSizeMl: 750 },
  { name: 'Pisco', bottlePrice: 25.00, bottleSizeMl: 750 },
  { name: 'Champagne', bottlePrice: 40.00, bottleSizeMl: 750 },
  { name: 'Prosecco', bottlePrice: 14.00, bottleSizeMl: 750 },
  { name: 'Sparkling Wine', bottlePrice: 12.00, bottleSizeMl: 750 },
  { name: 'Sparkling wine', bottlePrice: 12.00, bottleSizeMl: 750 },
  { name: 'Blue Curacao', bottlePrice: 12.00, bottleSizeMl: 750 },
  { name: 'Kahlua (Coffee Liqueur)', bottlePrice: 24.00, bottleSizeMl: 750 },
  { name: 'Pear Liqueur', bottlePrice: 22.00, bottleSizeMl: 750 },
  { name: 'Maraschino Liqueur (Optional)', bottlePrice: 30.00, bottleSizeMl: 750 },
  { name: 'Angostura Bitters', bottlePrice: 12.00, bottleSizeMl: 118 },
]

async function main() {
  console.log('Populating liquor prices...')

  for (const item of LIQUOR_PRICES) {
    await prisma.liquorPrice.upsert({
      where: { name: item.name },
      update: { bottlePrice: item.bottlePrice, bottleSizeMl: item.bottleSizeMl },
      create: { name: item.name, bottlePrice: item.bottlePrice, bottleSizeMl: item.bottleSizeMl },
    })
    console.log(`  ${item.name}: $${item.bottlePrice.toFixed(2)} (${item.bottleSizeMl}ml)`)
  }

  console.log(`Done. ${LIQUOR_PRICES.length} liquor prices upserted.`)
}

main()
  .catch((e) => {
    console.error('Failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
