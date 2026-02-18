import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const rows = await prisma.ingredient.groupBy({
      by: ["name", "orderUnit"],
      _count: { orderUnit: true },
      orderBy: { _count: { orderUnit: "desc" } },
    })
    // For each name, keep the orderUnit with the highest count (first after desc sort)
    const seen = new Map<string, string | null>()
    for (const row of rows) {
      if (!seen.has(row.name)) seen.set(row.name, row.orderUnit)
    }
    const ingredients = [...seen.entries()]
      .map(([name, orderUnit]) => ({ name, orderUnit }))
      .sort((a, b) => a.name.localeCompare(b.name))
    return NextResponse.json({ ingredients })
  } catch {
    return NextResponse.json({ ingredients: [] })
  }
}
