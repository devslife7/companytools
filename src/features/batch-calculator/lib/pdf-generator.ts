import type { BatchState } from "../types"
import {
  LITER_TO_ML,
  FIXED_BATCH_LITERS,
  CONVERSION_FACTORS,
  QUART_TO_ML,
  BOTTLE_SIZE_ML,
  parseAmount,
  calculateBatch,
  formatNumber,
  formatMLValue,
  combineAmountAndUnit,
} from "./calculations"
import { calculateGrandTotals, type LiquorPriceMap } from "./grand-totals"
import { isLiquorItem, isAngosturaBitters, isSodaItem } from "./ingredient-helpers"

// Helper function to format preferred unit display
const formatPreferredUnit = (preferredUnit: string | undefined, preferredUnitValue: number | null | undefined): string => {
  if (!preferredUnit || preferredUnitValue === null || preferredUnitValue === undefined) {
    return "-"
  }

  const unit = preferredUnit.toLowerCase().trim()

  // For "each", show as whole number
  if (unit === "each") {
    return `${Math.ceil(preferredUnitValue).toFixed(0)} ${preferredUnit}`
  }

  // For cans and bottles, round up and show as whole number with * separator
  if (unit === "12oz can" || unit === "12oz cans" || unit === "4oz bottle" || unit === "4oz bottles") {
    return `${Math.ceil(preferredUnitValue).toFixed(0)} (${preferredUnit})`
  }

  // For liters, quarts, gallons, show with 2 decimals
  return `${formatNumber(preferredUnitValue)} ${preferredUnit}`
}

// Helper function to generate HTML header
const generateHtmlHeader = (title: string, showHeader: boolean = true, compactPadding: boolean = false) => {
  const headerHtml = showHeader ? `
        <div class="header">
            <h1>${title}</h1>
           
        </div>
  ` : ''

  const bodyPadding = compactPadding ? '3mm' : '10mm'
  const summaryTitleMarginTop = compactPadding ? '4px' : '15px'

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${title}</title>
        <style>
            /* Compact B&W Styles for Print - Optimized for more content per page */
            body { font-family: sans-serif; margin: 0; padding: ${bodyPadding}; color: #000; background: #fff; font-size: 10.5pt; max-width: 216mm; margin: 0 auto; }
            h1 { font-size: 19pt; color: #000; margin: 0 0 5px 0; page-break-after: avoid; }
            h2 { font-size: 14.5pt; color: #000; margin: 12px 0 4px 0; page-break-after: avoid; }
            h3 { font-size: 12.5pt; color: #000; margin: 8px 0 3px 0; page-break-after: avoid; }
            h4 { font-size: 11.5pt; color: #000; margin: 6px 0 2px 0; page-break-after: avoid; }
            p { margin: 3px 0; font-size: 9.5pt; line-height: 1.2; }
            .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 5px; }
            .batch-section { margin-bottom: 15px; border: 1px solid #000; padding: 8px; page-break-inside: avoid; }
            .table-container { margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 9.5pt; }
            th, td { border: 1px solid #000; padding: 3px 4px; text-align: right; font-size: 9.5pt; }
            th { text-align: left; background-color: #f0f0f0; font-weight: bold; }
            .total-row td { font-weight: bold; background-color: #fff; }
            .summary-title { margin-top: ${summaryTitleMarginTop}; border-bottom: 1px solid #000; padding-bottom: 3px; }
            .summary-title-no-border { margin-top: ${summaryTitleMarginTop}; padding-bottom: 3px; }
            .text-left { text-align: left; }
            .batch-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
            .batch-title { flex: 1; margin-top: 0; }
            .batch-method { text-align: right; font-size: 9.5pt; margin-top: 0; }
        </style>
    </head>
    <body>
        ${headerHtml}
  `
}

// Helper function to generate shopping list HTML
const generateShoppingListHtml = (batches: BatchState[], priceMap?: LiquorPriceMap) => {
  const reportData = batches.filter(
    b => b.editableRecipe && ((typeof b.servings === "number" && b.servings > 0) || b.targetLiters > 0)
  )
  const grandTotals = calculateGrandTotals(reportData, priceMap)

  const hasPreferredUnits = [...grandTotals.liquor, ...grandTotals.soda, ...grandTotals.other].some(
    item => (item as any).preferredUnit
  )
  const hasPrices = grandTotals.liquor.some(item => item.estimatedCost != null)
  const hasLiquor = grandTotals.liquor.length > 0

  // Column visibility
  const showBottles = hasLiquor // Always show bottles column if we have liquor
  const showCost = hasPrices

  // Base columns: INGREDIENT = 1, optionally + Preferred Unit = 1
  let totalColumns = 1 // Ingredient
  if (hasPreferredUnits) totalColumns++
  if (showBottles) totalColumns++
  if (showCost) totalColumns++

  const preferredUnitHeader = hasPreferredUnits ? '<th class="text-left">Preferred Unit</th>' : ''
  const bottlesHeader = showBottles ? '<th style="text-align: right;">Bottles (750ml)</th>' : ''
  const costHeader = showCost ? '<th style="text-align: right;">Est. Cost</th>' : ''

  return `
    <h2 class="summary-title-no-border">Inventory Shopping List (Grand Totals based on Servings)</h2>
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th class="text-left">INGREDIENT</th>
                    ${preferredUnitHeader}
                    ${bottlesHeader}
                    ${costHeader}
                </tr>
            </thead>
            <tbody>
                ${grandTotals.liquor.length > 0 ? `
                <tr>
                    <td colspan="${totalColumns}" style="background-color: #d0d0d0; font-weight: bold; padding: 4px 6px; border-top: 2px solid #000; border-bottom: 1px solid #000; font-size: 9.5pt; text-align: left;">
                        LIQUOR ITEMS
                    </td>
                </tr>
                ${grandTotals.liquor
        .map(
          ing => `
                    <tr class="total-row">
                        <td class="text-left">${ing.name}</td>
                        ${hasPreferredUnits ? `<td class="text-left">${formatPreferredUnit(ing.preferredUnit, ing.preferredUnitValue)}</td>` : ''}
                        ${showBottles ? `<td>${!isAngosturaBitters(ing.name) && ing.bottles > 0
              ? `<div style="display: flex; justify-content: flex-end; align-items: center; gap: 4px; white-space: nowrap;">
                                <span style="font-size: 0.85em; color: #666; font-weight: normal;">(${formatNumber(ing.bottles)})</span>
                                <strong>${Math.ceil(ing.bottles)}</strong>
                               </div>`
              : '-'}</td>` : ''}
                        ${showCost ? `<td>${ing.estimatedCost != null ? `$${ing.estimatedCost.toFixed(2)}` : '-'}</td>` : ''}
                    </tr>
                `
        )
        .join("")}
                ${hasPrices && grandTotals.totalLiquorCost > 0 ? `
                <tr>
                    <td colspan="${totalColumns - 1}" style="text-align: right; font-weight: bold; background-color: #d0d0d0; padding: 4px 6px;">ESTIMATED LIQUOR COST</td>
                    <td style="font-weight: bold; background-color: #d0d0d0;">$${grandTotals.totalLiquorCost.toFixed(2)}</td>
                </tr>
                ` : ''}
                ` : ""}

                ${grandTotals.soda.length > 0 ? `
                <tr>
                    <td colspan="${totalColumns}" style="background-color: #d0d0d0; font-weight: bold; padding: 4px 6px; border-top: ${grandTotals.liquor.length > 0 ? '1px' : '2px'} solid #000; border-bottom: 1px solid #000; font-size: 9.5pt; text-align: left;">
                        SODA ITEMS
                    </td>
                </tr>
                ${grandTotals.soda
        .map(
          ing => `
                    <tr class="total-row">
                        <td class="text-left">${ing.name}</td>
                        ${hasPreferredUnits ? `<td class="text-left">${formatPreferredUnit(ing.preferredUnit, ing.preferredUnitValue)}</td>` : ''}
                        ${showBottles ? '<td>-</td>' : ''}
                        ${showCost ? '<td>-</td>' : ''}
                    </tr>
                `
        )
        .join("")}
                ` : ""}

                ${grandTotals.other.length > 0 ? `
                <tr>
                    <td colspan="${totalColumns}" style="background-color: #d0d0d0; font-weight: bold; padding: 4px 6px; border-top: ${(grandTotals.liquor.length > 0 || grandTotals.soda.length > 0) ? '1px' : '2px'} solid #000; border-bottom: 1px solid #000; font-size: 9.5pt; text-align: left;">
                        OTHER ITEMS
                    </td>
                </tr>
                ${grandTotals.other
        .map(
          ing => `
                    <tr class="total-row">
                        <td class="text-left">${ing.name}</td>
                        ${hasPreferredUnits ? `<td class="text-left">${formatPreferredUnit(ing.preferredUnit, ing.preferredUnitValue)}</td>` : ''}
                        ${showBottles ? '<td>-</td>' : ''}
                        ${showCost ? '<td>-</td>' : ''}
                    </tr>
                `
        )
        .join("")}
                ` : ""}
            </tbody>
        </table>
    </div>
  `
}

// Helper function to generate batch calculations HTML
const generateBatchCalculationsHtml = (batches: BatchState[], extraTopMargin: boolean = false) => {
  const reportData = batches.filter(
    b => b.editableRecipe && ((typeof b.servings === "number" && b.servings > 0) || b.targetLiters > 0)
  )
  const fixedTargetLiters = FIXED_BATCH_LITERS

  const extraMarginStyle = extraTopMargin ? ' style="margin-top: 20px;"' : ''
  let htmlContent = `<h2 class="summary-title-no-border"${extraMarginStyle}>Individual Batch Sheets</h2>`

  reportData.forEach(batch => {
    if (!batch.editableRecipe) return

    const recipe = batch.editableRecipe
    const servingsNum =
      typeof batch.servings === "number"
        ? batch.servings
        : batch.servings === ""
          ? 0
          : parseInt(batch.servings, 10) || 0

    // Exclude soda items from batch volume calculations
    const singleServingVolumeML = recipe.ingredients
      .filter(item => !isSodaItem(item.name))
      .reduce((totalML, item) => {
        const amountString = item.unit ? combineAmountAndUnit(item.amount, item.unit) : item.amount
        const { baseAmount, unit, type } = parseAmount(amountString)
        if (type === "liquid") {
          return totalML + baseAmount * (CONVERSION_FACTORS[unit] || 0)
        }
        return totalML
      }, 0)
    const twentyLiterML = fixedTargetLiters * LITER_TO_ML

    // Calculate for Servings Batch (if valid)
    const servingsBatchIngredients =
      servingsNum > 0
        ? recipe.ingredients.map(item => {
          const batchResult = calculateBatch(servingsNum, item.amount, item.unit)
          return { name: item.name, singleAmount: item.amount, ...batchResult }
        })
        : []
    const totalServingsLiquidML = servingsBatchIngredients
      .filter(ing => !isSodaItem(ing.name))
      .reduce((sum, ing) => sum + ing.ml, 0)

    // Calculate for Fixed 20L Target Liter Batch (if valid)
    const targetBatchIngredients =
      singleServingVolumeML > 0
        ? recipe.ingredients.map(item => {
          const amountString = combineAmountAndUnit(item.amount, item.unit)
          const { baseAmount, unit, type } = parseAmount(amountString)

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
                <div class="batch-header">
                    <h3 class="batch-title">${recipe.name}${recipe.id ? ` #${recipe.id}` : ""}</h3>
                    <div class="batch-method">${servingsNum > 0 ? `<strong>${servingsNum}pp</strong> | ` : ""}<strong>Method:</strong> ${recipe.method || "N/A"}${servingsNum > 0 ? ` | <strong>Total:</strong> ${formatNumber(totalServingsLiquidML / LITER_TO_ML)} L` : ""}</div>
                </div>
                ${recipe.instructions ? `<p style="margin: 4px 0 2px 0;"><strong>Instructions:</strong></p><p style="margin: 0 0 4px 0; white-space: pre-line;">${recipe.instructions}</p>` : ''}

                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style="text-align: center;">INGREDIENT</th>
                                <th style="text-align: center;">1 Serving</th>
                                ${servingsNum > 0 ? `<th style="text-align: center;">${servingsNum} Servings (ML)</th>` : ""}
                                ${totalServingsLiquidML > twentyLiterML && singleServingVolumeML > 0
        ? `<th style="text-align: center;">${fixedTargetLiters}L Batch (ML)</th>`
        : ""
      }
                            </tr>
                        </thead>
                        <tbody>
                            ${recipe.ingredients
        .map((item, index) => {
          const servingsCalc = servingsBatchIngredients[index]
          const targetCalc = targetBatchIngredients[index]
          const amountString = combineAmountAndUnit(item.amount, item.unit)
          const { type } = parseAmount(amountString)
          const isLiquor = isLiquorItem(item.name)
          const isAngostura = isAngosturaBitters(item.name)
          const isSoda = isSodaItem(item.name)

          const servingsData = servingsCalc
            ? type === "liquid"
              ? isSoda
                ? "N/A"
                : isLiquor && !isAngostura && servingsCalc.bottles > 0
                  ? `(${formatNumber(servingsCalc.bottles)} @750ml) ${formatMLValue(servingsCalc.ml)} ml`
                  : `${formatMLValue(servingsCalc.ml)} ml`
              : "N/A"
            : "N/A"

          const targetData = targetCalc
            ? type === "liquid"
              ? isSoda
                ? "N/A"
                : isLiquor && !isAngostura && targetCalc.bottles > 0
                  ? `(${formatNumber(targetCalc.bottles)} @750ml) ${formatMLValue(targetCalc.ml)} ml`
                  : `${formatMLValue(targetCalc.ml)} ml`
              : "N/A"
            : "N/A"

          const displayAmount = combineAmountAndUnit(item.amount, item.unit)
          return `<tr>
                                    <td class="text-left">${item.name}</td>
                                    <td>${displayAmount}</td>
                                    ${servingsNum > 0 ? `<td>${servingsData}</td>` : ""}
                                    ${totalServingsLiquidML > twentyLiterML && singleServingVolumeML > 0
              ? `<td>${targetData}</td>`
              : ""
            }
                                </tr>`
        })
        .join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `
  })

  return htmlContent
}

// Helper function to open PDF in new window
const openPdfWindow = (htmlContent: string) => {
  const newWindow = window.open()
  if (newWindow) {
    newWindow.document.write(htmlContent)
    newWindow.document.close()
    newWindow.focus()
  }
}

// Generate shopping list PDF only
export const generateShoppingListPdf = (batches: BatchState[], priceMap?: LiquorPriceMap) => {
  const htmlContent = generateHtmlHeader("Cocktail Shopping List", false, true) + generateShoppingListHtml(batches, priceMap) + `</body></html>`
  openPdfWindow(htmlContent)
}

// Generate batch calculations PDF only
export const generateBatchCalculationsPdf = (batches: BatchState[]) => {
  const htmlContent = generateHtmlHeader("Cocktail Batching Calculations", false, true) + generateBatchCalculationsHtml(batches) + `</body></html>`
  openPdfWindow(htmlContent)
}

// Generate full report (both shopping list and batch calculations)
export const generatePdfReport = (batches: BatchState[], priceMap?: LiquorPriceMap) => {
  // Generate both shopping list and batch calculations
  const htmlContent = generateHtmlHeader("Cocktail Batching Production Sheet", false, true) + generateShoppingListHtml(batches, priceMap) + generateBatchCalculationsHtml(batches, true) + `</body></html>`
  openPdfWindow(htmlContent)
}
