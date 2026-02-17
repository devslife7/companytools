import { prisma } from './prisma'

export interface LiquorPriceEntry {
  price: number
  bottleSizeMl: number
}

export async function getAllLiquorPrices(): Promise<Record<string, LiquorPriceEntry>> {
  const prices = await prisma.liquorPrice.findMany()
  const priceMap: Record<string, LiquorPriceEntry> = {}

  for (const p of prices) {
    priceMap[p.name.toLowerCase()] = {
      price: Number(p.bottlePrice),
      bottleSizeMl: p.bottleSizeMl,
    }
  }

  return priceMap
}
