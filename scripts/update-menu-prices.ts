import 'dotenv/config'
import { prisma } from '../src/lib/db/prisma'

const MENU_PRICES = [
  { id: 95,  menuPrice: 14 },
  { id: 96,  menuPrice: 18 },
  { id: 97,  menuPrice: 17 },
  { id: 98,  menuPrice: 20 },
  { id: 99,  menuPrice: 20 },
  { id: 100, menuPrice: 22 },
  { id: 101, menuPrice: 20 },
  { id: 102, menuPrice: 22 },
  { id: 103, menuPrice: 18 },
  { id: 104, menuPrice: 18 },
  { id: 105, menuPrice: 20 },
  { id: 106, menuPrice: 18 },
  { id: 107, menuPrice: 18 },
  { id: 108, menuPrice: 20 },
  { id: 109, menuPrice: 18 },
  { id: 110, menuPrice: 15 },
  { id: 111, menuPrice: 19 },
  { id: 112, menuPrice: 18 },
]

async function main() {
  for (const item of MENU_PRICES) {
    await prisma.cocktail.update({ where: { id: item.id }, data: { menuPrice: item.menuPrice } })
    console.log(`  id ${item.id}: $${item.menuPrice}`)
  }
  console.log('Done.')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
