import type { BatchState } from "../types"
import {
  LITER_TO_ML,
  FIXED_BATCH_LITERS,
  CONVERSION_FACTORS,
  QUART_TO_ML,
  BOTTLE_SIZE_ML,
  parseAmount,
  calculateBatch,
  calculateSingleServingLiquidVolumeML,
  formatNumber,
  formatMLValue,
} from "./calculations"
import { calculateGrandTotals } from "./grand-totals"

export const generatePdfReport = (batches: BatchState[]) => {
  const reportData = batches.filter(
    b => b.editableRecipe && ((typeof b.servings === "number" && b.servings > 0) || b.targetLiters > 0)
  )
  const grandTotals = calculateGrandTotals(reportData)
  const fixedTargetLiters = FIXED_BATCH_LITERS

  // --- Start HTML for Print Report (Black and White/Simplified) ---
  let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Cocktail Batching Report</title>
                <style>
                    /* Simplified B&W Styles for Print */
                    body { font-family: sans-serif; margin: 0; padding: 20mm; color: #000; background: #fff; }
                    h1, h2, h3, h4 { color: #000; page-break-after: avoid; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                    .batch-section { margin-bottom: 40px; border: 1px solid #000; padding: 20px; page-break-inside: avoid; }
                    .table-container { margin-top: 15px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #000; padding: 8px; text-align: right; }
                    th { text-align: left; background-color: #f0f0f0; }
                    .total-row td { font-weight: bold; background-color: #e0e0e0; }
                    .summary-title { margin-top: 40px; border-bottom: 2px solid #000; padding-bottom: 5px; }
                    .text-left { text-align: left; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Cocktail Batching Production Sheet</h1>
                    <p>Generated on: ${new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}</p>
                </div>
        `

  // 1. Grand Total Summary (Inventory Shopping List) - Separated by Liquor, Soda, and Other Items
  const hasSodaItems = grandTotals.soda.length > 0
  const totalColumns = hasSodaItems ? 5 : 4
  const canColumnHeader = hasSodaItems ? '<th>12oz Cans</th>' : ''
  
  htmlContent += `
            <h2 class="summary-title">Inventory Shopping List (Grand Totals based on Servings)</h2>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th class="text-left">INGREDIENT</th>
                            <th>Total ML (Rounded UP)</th>
                            <th>Total Quarts (Q)</th>
                            <th>Approx. @750 BOTTLES</th>
                            ${canColumnHeader}
                        </tr>
                    </thead>
                    <tbody>
                        ${grandTotals.liquor.length > 0 ? `
                        <tr>
                            <td colspan="${totalColumns}" style="background-color: #d0d0d0; font-weight: bold; padding: 12px; border-top: 3px solid #000; border-bottom: 2px solid #000;">
                                LIQUOR ITEMS
                            </td>
                        </tr>
                        ${grandTotals.liquor
                          .map(
                            ing => `
                            <tr class="total-row">
                                <td class="text-left">${ing.name}</td>
                                <td>${formatMLValue(ing.ml)}</td>
                                <td>${formatNumber(ing.quart)}</td>
                                <td>${formatNumber(ing.bottles)}</td>
                                ${hasSodaItems ? '<td>-</td>' : ''}
                            </tr>
                        `
                          )
                          .join("")}
                        ` : ""}
                        ${grandTotals.liquor.length > 0 && (grandTotals.soda.length > 0 || grandTotals.other.length > 0) ? `
                        <tr>
                            <td colspan="${totalColumns}" style="background-color: #e8e8e8; padding: 8px; border-top: 2px solid #000; border-bottom: 2px solid #000;">
                                <!-- Divider between sections -->
                            </td>
                        </tr>
                        ` : ""}
                        ${grandTotals.soda.length > 0 ? `
                        <tr>
                            <td colspan="${totalColumns}" style="background-color: #d0d0d0; font-weight: bold; padding: 12px; border-top: ${grandTotals.liquor.length > 0 ? '2px' : '3px'} solid #000; border-bottom: 2px solid #000;">
                                SODA ITEMS
                            </td>
                        </tr>
                        ${grandTotals.soda
                          .map(
                            ing => `
                            <tr class="total-row">
                                <td class="text-left">${ing.name}</td>
                                <td>${formatMLValue(ing.ml)}</td>
                                <td>${formatNumber(ing.quart)}</td>
                                <td>${formatNumber(ing.bottles)}</td>
                                ${hasSodaItems ? `<td>${ing.cans12oz ? ing.cans12oz.toFixed(0) : '-'}</td>` : ''}
                            </tr>
                        `
                          )
                          .join("")}
                        ` : ""}
                        ${(grandTotals.liquor.length > 0 || grandTotals.soda.length > 0) && grandTotals.other.length > 0 ? `
                        <tr>
                            <td colspan="${totalColumns}" style="background-color: #e8e8e8; padding: 8px; border-top: 2px solid #000; border-bottom: 2px solid #000;">
                                <!-- Divider between sections -->
                            </td>
                        </tr>
                        ` : ""}
                        ${grandTotals.other.length > 0 ? `
                        <tr>
                            <td colspan="${totalColumns}" style="background-color: #d0d0d0; font-weight: bold; padding: 12px; border-top: ${(grandTotals.liquor.length > 0 || grandTotals.soda.length > 0) ? '2px' : '3px'} solid #000; border-bottom: 2px solid #000;">
                                OTHER ITEMS
                            </td>
                        </tr>
                        ${grandTotals.other
                          .map(
                            ing => `
                            <tr class="total-row">
                                <td class="text-left">${ing.name}</td>
                                <td>${formatMLValue(ing.ml)}</td>
                                <td>${formatNumber(ing.quart)}</td>
                                <td>${formatNumber(ing.bottles)}</td>
                                ${hasSodaItems ? '<td>-</td>' : ''}
                            </tr>
                        `
                          )
                          .join("")}
                        ` : ""}
                    </tbody>
                </table>
            </div>
        `

  // 2. Individual Batch Sections
  htmlContent += `<h2 class="summary-title" style="margin-top: 50px;">Individual Batch Sheets</h2>`

  reportData.forEach(batch => {
    if (!batch.editableRecipe) return

    const recipe = batch.editableRecipe
    const servingsNum =
      typeof batch.servings === "number"
        ? batch.servings
        : batch.servings === ""
        ? 0
        : parseInt(batch.servings, 10) || 0

    const singleServingVolumeML = calculateSingleServingLiquidVolumeML(recipe)
    const twentyLiterML = fixedTargetLiters * LITER_TO_ML

    // Calculate for Servings Batch (if valid)
    const servingsBatchIngredients =
      servingsNum > 0
        ? recipe.ingredients.map(item => {
            const batchResult = calculateBatch(servingsNum, item.amount)
            return { name: item.name, singleAmount: item.amount, ...batchResult }
          })
        : []
    const totalServingsLiquidML = servingsBatchIngredients.reduce((sum, ing) => sum + ing.ml, 0)

    // Calculate for Fixed 20L Target Liter Batch (if valid)
    const targetBatchIngredients =
      singleServingVolumeML > 0
        ? recipe.ingredients.map(item => {
            const { baseAmount, unit, type } = parseAmount(item.amount)

            if (type !== "liquid") {
              return {
                name: item.name,
                singleAmount: item.amount,
                unitType: type,
                originalUnit: unit,
                ml: 0,
                quart: 0,
                bottles: 0,
              }
            }

            const ingredientML = baseAmount * (CONVERSION_FACTORS[unit] || 0)
            const proportion = ingredientML / singleServingVolumeML
            const fixedTargetML = fixedTargetLiters * LITER_TO_ML
            const finalML = fixedTargetML * proportion

            return {
              name: item.name,
              singleAmount: item.amount,
              unitType: "liquid",
              originalUnit: unit,
              ml: finalML,
              quart: finalML / QUART_TO_ML,
              bottles: finalML / BOTTLE_SIZE_ML,
            }
          })
        : []

    htmlContent += `
                <div class="batch-section">
                    <h3>Cocktail: ${recipe.name} (Batch #${batch.id})</h3>
                    <p><strong>1-Serving Liquid Volume:</strong> ${formatNumber(singleServingVolumeML)} ML</p>
                    <p style="margin-top: 10px;"><strong>Garnish:</strong> ${recipe.garnish || "N/A"}</p>
                    <p><strong>Method:</strong> ${recipe.method || "N/A"}</p>

                    <h4 style="margin-top: 20px;">Ingredient Amounts</h4>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th class="text-left">INGREDIENT</th>
                                    <th>1 Serving</th>
                                    ${servingsNum > 0 ? `<th>${servingsNum} SERVINGS (ML) (Rounded UP)</th>` : ""}
                                    ${
                                      totalServingsLiquidML > twentyLiterML && singleServingVolumeML > 0
                                        ? `<th>${fixedTargetLiters} LITER BATCH (ML) (Rounded UP)</th>`
                                        : ""
                                    }
                                </tr>
                            </thead>
                            <tbody>
                                ${recipe.ingredients
                                  .map((item, index) => {
                                    const servingsCalc = servingsBatchIngredients[index]
                                    const targetCalc = targetBatchIngredients[index]
                                    const { type } = parseAmount(item.amount)

                                    const servingsData = servingsCalc
                                      ? type === "liquid"
                                        ? formatMLValue(servingsCalc.ml)
                                        : type === "count"
                                        ? `${formatNumber(servingsCalc.ml, 0)} ${servingsCalc.originalUnit}`
                                        : servingsCalc.originalUnit
                                      : "N/A"

                                    const targetData = targetCalc
                                      ? type === "liquid"
                                        ? formatMLValue(targetCalc.ml)
                                        : "N/A (Liquid Only)"
                                      : "N/A"

                                    return `<tr>
                                        <td class="text-left">${item.name}</td>
                                        <td>${item.amount}</td>
                                        ${servingsNum > 0 ? `<td>${servingsData}</td>` : ""}
                                        ${
                                          totalServingsLiquidML > twentyLiterML && singleServingVolumeML > 0
                                            ? `<td>${targetData}</td>`
                                            : ""
                                        }
                                    </tr>`
                                  })
                                  .join("")}
                            </tbody>
                        </table>
                    </div>
                    
                    ${
                      servingsNum > 0
                        ? `<p style="margin-top: 15px;">Total Volume for ${servingsNum} Servings: <strong>${formatNumber(
                            totalServingsLiquidML / LITER_TO_ML
                          )} L</strong></p>`
                        : ""
                    }
                </div>
            `
  })

  htmlContent += `</body></html>`

  // Open a new window and print the content
  const newWindow = window.open()
  if (newWindow) {
    newWindow.document.write(htmlContent)
    newWindow.document.close()
    newWindow.focus()
  }
}
