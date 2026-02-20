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

// Helper function to format order unit display
const formatOrderUnit = (orderUnit: string | undefined, orderUnitValue: number | null | undefined): string => {
  if (!orderUnit || orderUnitValue === null || orderUnitValue === undefined) {
    return "-"
  }

  const unit = orderUnit.toLowerCase().trim()

  // For "each", show as whole number
  if (unit === "each") {
    return `${Math.ceil(orderUnitValue).toFixed(0)} ${orderUnit}`
  }

  // For cans and bottles, round up and show as whole number with * separator
  if (unit === "12oz can" || unit === "12oz cans" || unit === "4oz bottle" || unit === "4oz bottles") {
    return `${Math.ceil(orderUnitValue).toFixed(0)} (${orderUnit})`
  }

  // For liters, quarts, gallons, show with 2 decimals
  return `${formatNumber(orderUnitValue)} ${orderUnit}`
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

  const hasOrderUnits = [...grandTotals.liquor, ...grandTotals.soda, ...grandTotals.other].some(
    item => (item as any).orderUnit
  )
  const hasPrices = grandTotals.liquor.some(item => item.estimatedCost != null)
  const hasLiquor = grandTotals.liquor.length > 0

  // Column visibility
  const showBottles = hasLiquor // Always show bottles column if we have liquor
  const showCost = hasPrices

  // Base columns: INGREDIENT = 1, optionally + Order Unit = 1
  let totalColumns = 1 // Ingredient
  if (hasOrderUnits) totalColumns++
  if (showBottles) totalColumns++
  if (showCost) totalColumns++

  const orderUnitHeader = hasOrderUnits ? '<th class="text-left">Order Unit</th>' : ''
  const bottlesHeader = showBottles ? '<th style="text-align: right;">Bottles (750ml)</th>' : ''
  const costHeader = showCost ? '<th style="text-align: right;">Est. Cost</th>' : ''

  return `
    <h2 class="summary-title-no-border">Inventory Shopping List (Grand Totals based on Servings)</h2>
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th class="text-left">INGREDIENT</th>
                    ${orderUnitHeader}
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
                        ${hasOrderUnits ? `<td class="text-left">${formatOrderUnit(ing.orderUnit, ing.orderUnitValue)}</td>` : ''}
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
                        ${hasOrderUnits ? `<td class="text-left">${formatOrderUnit(ing.orderUnit, ing.orderUnitValue)}</td>` : ''}
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
                        ${hasOrderUnits ? `<td class="text-left">${formatOrderUnit(ing.orderUnit, ing.orderUnitValue)}</td>` : ''}
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

// Generate Event Invoice HTML
const generateInvoiceHtml = (batches: BatchState[], event: any) => {
  const eventDate = new Date(event.eventDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  const invoiceDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const invoiceNumber = `INV-${event.id.toString().padStart(4, '0')}`;

  const GLASSWARE_RATE = 2.00; // per glass

  let totalAmount = 0;

  const tableRows = batches.map(batch => {
    const recipe = batch.editableRecipe;
    if (!recipe) return '';
    const price = recipe.menuPrice || 0;
    const servings = typeof batch.servings === 'number' ? batch.servings : parseInt(batch.servings || '0', 10);
    const lineTotal = price * servings;
    totalAmount += lineTotal;

    return `
        <tr class="item-row">
          <td class="text-left">${recipe.name}</td>
          <td class="text-center">${servings}</td>
          <td class="text-right">$${price.toFixed(2)}</td>
          <td class="text-right">$${lineTotal.toFixed(2)}</td>
        </tr>
      `;
  }).join('');

  // Glassware rental — group by glass type, sum servings
  const glassTotals: Record<string, number> = {};
  batches.forEach(batch => {
    const recipe = batch.editableRecipe;
    if (!recipe?.glassType) return;
    const servings = typeof batch.servings === 'number' ? batch.servings : parseInt(batch.servings || '0', 10);
    if (servings <= 0) return;
    glassTotals[recipe.glassType] = (glassTotals[recipe.glassType] || 0) + servings;
  });

  let glasswareTotal = 0;
  const glasswareRows = Object.entries(glassTotals).map(([glassType, qty]) => {
    const lineTotal = qty * GLASSWARE_RATE;
    glasswareTotal += lineTotal;
    return `
        <tr class="item-row glassware-row">
          <td class="text-left">${glassType} Glass Rental</td>
          <td class="text-center">${qty}</td>
          <td class="text-right">$${GLASSWARE_RATE.toFixed(2)}</td>
          <td class="text-right">$${lineTotal.toFixed(2)}</td>
        </tr>
      `;
  }).join('');

  totalAmount += glasswareTotal;

  const TAX_RATE = 0.0825; // 8.25%
  const taxAmount = totalAmount * TAX_RATE;
  const grandTotal = totalAmount + taxAmount;

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Invoice - ${event.name}</title>
        <style>
            body { font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 20mm; color: #1f2937; background: #f9fafb; line-height: 1.5; }
            .invoice-wrapper { max-width: 800px; margin: auto; padding: 40px; background: #ffffff; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border-radius: 12px; }
            table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 10px; }
            table td { padding: 12px 16px; vertical-align: top; }
            .header-info { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #f3f4f6; padding-bottom: 30px; }
            .company-info { font-size: 14px; color: #4b5563; }
            .company-name { font-size: 28px; font-weight: 800; color: #f54900; margin-bottom: 6px; letter-spacing: -0.5px; }
            .invoice-details { text-align: right; }
            .invoice-title { font-size: 32px; font-weight: 800; color: #111827; margin-bottom: 8px; letter-spacing: -0.5px; text-transform: uppercase; }
            .invoice-meta { font-size: 14px; color: #4b5563; }
            .event-info { margin-bottom: 30px; background: #fdf2f8; padding: 20px; border-radius: 8px; border: 1px solid #fce7f3; }
            .event-info h3 { margin: 0 0 10px 0; color: #be185d; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
            .event-info p { margin: 0; color: #111827; font-size: 15px; }
            .items-table { margin-top: 20px; }
            .items-table th { padding: 12px 16px; background: #f9fafb; color: #4b5563; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb; border-top: 1px solid #e5e7eb; }
            .items-table th.text-center { text-align: center; }
            .items-table th.text-right { text-align: right; }
            .items-table td.text-left { text-align: left; }
            .items-table td.text-center { text-align: center; }
            .items-table td.text-right { text-align: right; font-variant-numeric: tabular-nums; }
            .item-row td { border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #111827; }
            .item-row td.text-left { font-weight: 500; }
            .item-row:last-child td { border-bottom: none; }
            .section-label-row td { padding: 8px 16px; border-bottom: 1px solid #e5e7eb; }
            .section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #6b7280; background: #f9fafb; }
            .glassware-row td { color: #374151; }
            .total-section { width: 320px; float: right; margin-top: 30px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
            .total-row { display: flex; justify-content: space-between; padding: 12px 20px; font-size: 14px; color: #4b5563; }
            .total-row.grand-total { border-top: 1px solid #e5e7eb; font-size: 20px; font-weight: 800; color: #111827; background: #fff; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
            .grand-total .amount { color: #f54900; }
            .footer { margin-top: 80px; text-align: center; color: #6b7280; font-size: 13px; clear: both; border-top: 1px solid #e5e7eb; padding-top: 24px; }
            
            @media print {
                body { background: #fff; padding: 0; }
                .invoice-wrapper { box-shadow: none; border: none; padding: 20px; max-width: 100%; }
            }
        </style>
    </head>
    <body>
        <div class="invoice-wrapper">
            <div class="header-info">
                <div class="company-info">
                    <div class="company-name">Catering Co.</div>
                    123 Event Street<br>
                    Suite 100<br>
                    City, State 12345<br>
                    contact@catering.com
                </div>
                <div class="invoice-details">
                    <div class="invoice-title">Invoice</div>
                    <div class="invoice-meta">
                        <strong>Invoice Number:</strong> ${invoiceNumber}<br>
                        <strong>Date:</strong> ${invoiceDate}
                    </div>
                </div>
            </div>

            <div class="event-info">
                <h3>Event Overview</h3>
                <p>
                    <strong>${event.name}</strong> • ${eventDate}
                </p>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th class="text-left">Description</th>
                        <th class="text-center">Qty</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-right">Line Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="section-label-row">
                        <td colspan="4" class="section-label">Cocktail Service</td>
                    </tr>
                    ${tableRows}
                    ${glasswareRows ? `
                    <tr class="section-label-row">
                        <td colspan="4" class="section-label">Glassware Rental</td>
                    </tr>
                    ${glasswareRows}
                    ` : ''}
                </tbody>
            </table>

            <div class="total-section">
                <div class="total-row">
                    <span>Subtotal</span>
                    <span>$${totalAmount.toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>Tax (8.25%)</span>
                    <span>$${taxAmount.toFixed(2)}</span>
                </div>
                <div class="total-row grand-total">
                    <span>Total Due</span>
                    <span class="amount">$${grandTotal.toFixed(2)}</span>
                </div>
            </div>

            <div class="footer">
                Thank you for your business! Please make checks payable to Catering Co.<br>
                For payment questions, please contact us at billing@catering.com.
            </div>
        </div>
    </body>
    </html>
  `
}

export const generateClientInvoicePdf = (batches: BatchState[], event: any) => {
  const htmlContent = generateInvoiceHtml(batches, event)
  openPdfWindow(htmlContent)
}

// Generate Order List HTML (invoice-style design)
const generateOrderListHtml = (batches: BatchState[], priceMap?: LiquorPriceMap, eventName?: string) => {
  const reportData = batches.filter(
    b => b.editableRecipe && ((typeof b.servings === "number" && b.servings > 0) || b.targetLiters > 0)
  )
  const grandTotals = calculateGrandTotals(reportData, priceMap)
  const orderDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  const orderNumber = `ORD-${Date.now().toString().slice(-6)}`

  const hasPrices = grandTotals.liquor.some(item => item.estimatedCost != null)

  const renderSection = (title: string, color: string, bg: string, items: typeof grandTotals.liquor, showBottles: boolean) => {
    if (items.length === 0) return ''
    const rows = items.map(item => `
      <tr class="item-row">
        <td class="text-left">${item.name}</td>
        <td class="text-center">${formatOrderUnit((item as any).orderUnit, (item as any).orderUnitValue)}</td>
        ${showBottles ? `<td class="text-center">${!isAngosturaBitters(item.name) && item.bottles > 0
          ? `<span class="bottle-exact">(${formatNumber(item.bottles)})</span> <strong>${Math.ceil(item.bottles)}</strong>`
          : '—'}</td>` : `<td class="text-center">—</td>`}
        <td class="text-right">${hasPrices && item.estimatedCost != null ? `$${item.estimatedCost.toFixed(2)}` : '—'}</td>
      </tr>
    `).join('')

    return `
      <tr class="section-header" style="background:${bg};">
        <td colspan="4" style="padding:10px 16px; font-weight:700; font-size:11px; text-transform:uppercase; letter-spacing:0.8px; color:${color}; border-bottom:2px solid ${color}20;">${title}</td>
      </tr>
      ${rows}
    `
  }

  const liquorSection = renderSection('Liquor Items', '#f54900', '#fff7f4', grandTotals.liquor, true)
  const sodaSection = renderSection('Soda & Mixers', '#0369a1', '#f0f9ff', grandTotals.soda as any, false)
  const otherSection = renderSection('Other Items', '#047857', '#f0fdf4', grandTotals.other as any, false)

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Order List${eventName ? ` — ${eventName}` : ''}</title>
        <style>
            body { font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 20mm; color: #1f2937; background: #f9fafb; line-height: 1.5; }
            .wrapper { max-width: 800px; margin: auto; padding: 40px; background: #ffffff; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); border-radius: 12px; }
            .header-info { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #f3f4f6; padding-bottom: 30px; }
            .company-name { font-size: 28px; font-weight: 800; color: #f54900; margin-bottom: 6px; letter-spacing: -0.5px; }
            .company-info { font-size: 14px; color: #4b5563; }
            .doc-details { text-align: right; }
            .doc-title { font-size: 32px; font-weight: 800; color: #111827; margin-bottom: 8px; letter-spacing: -0.5px; text-transform: uppercase; }
            .doc-meta { font-size: 14px; color: #4b5563; }
            .event-bar { margin-bottom: 28px; background: #fff7f4; padding: 16px 20px; border-radius: 8px; border: 1px solid #fed7c3; display: flex; align-items: center; gap: 12px; }
            .event-bar-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #f54900; }
            .event-bar-name { font-size: 15px; font-weight: 600; color: #111827; }
            table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 10px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
            thead th { padding: 12px 16px; background: #f9fafb; color: #4b5563; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb; }
            thead th.text-left { text-align: left; }
            thead th.text-center { text-align: center; }
            thead th.text-right { text-align: right; }
            .item-row td { padding: 11px 16px; font-size: 14px; color: #111827; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
            .item-row:last-child td { border-bottom: none; }
            .item-row td.text-left { font-weight: 500; }
            .item-row td.text-center { text-align: center; }
            .item-row td.text-right { text-align: right; font-variant-numeric: tabular-nums; }
            .bottle-exact { font-size: 11px; color: #9ca3af; font-weight: 400; }
            .total-section { width: 280px; float: right; margin-top: 28px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
            .total-row { display: flex; justify-content: space-between; padding: 12px 20px; font-size: 14px; color: #4b5563; border-bottom: 1px solid #f3f4f6; }
            .total-row:last-child { border-bottom: none; }
            .total-row.grand-total { font-size: 18px; font-weight: 800; color: #111827; background: #fff; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
            .grand-total .amount { color: #f54900; }
            .footer { margin-top: 80px; text-align: center; color: #6b7280; font-size: 13px; clear: both; border-top: 1px solid #e5e7eb; padding-top: 24px; }
            @media print {
                body { background: #fff; padding: 0; }
                .wrapper { box-shadow: none; border: none; padding: 20px; max-width: 100%; }
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="header-info">
                <div class="company-info">
                    <div class="company-name">Catering Co.</div>
                    123 Event Street<br>
                    Suite 100<br>
                    City, State 12345<br>
                    contact@catering.com
                </div>
                <div class="doc-details">
                    <div class="doc-title">Order List</div>
                    <div class="doc-meta">
                        <strong>Order #:</strong> ${orderNumber}<br>
                        <strong>Date:</strong> ${orderDate}
                    </div>
                </div>
            </div>

            ${eventName ? `
            <div class="event-bar">
                <span class="event-bar-label">Event</span>
                <span class="event-bar-name">${eventName}</span>
            </div>
            ` : ''}

            <table>
                <thead>
                    <tr>
                        <th class="text-left">Ingredient</th>
                        <th class="text-center">Qty Needed</th>
                        <th class="text-center">Bottles (750ml)</th>
                        <th class="text-right">Est. Cost</th>
                    </tr>
                </thead>
                <tbody>
                    ${liquorSection}
                    ${sodaSection}
                    ${otherSection}
                </tbody>
            </table>

            ${hasPrices && grandTotals.totalLiquorCost > 0 ? `
            <div class="total-section">
                <div class="total-row">
                    <span>Liquor Cost</span>
                    <span>$${grandTotals.totalLiquorCost.toFixed(2)}</span>
                </div>
                <div class="total-row grand-total">
                    <span>Est. Total</span>
                    <span class="amount">$${grandTotals.totalLiquorCost.toFixed(2)}</span>
                </div>
            </div>
            ` : ''}

            <div class="footer">
                Generated by Catering Co. internal tools &mdash; for internal use only.
            </div>
        </div>
    </body>
    </html>
  `
}

export const generateOrderListPdf = (batches: BatchState[], priceMap?: LiquorPriceMap, eventName?: string) => {
  const htmlContent = generateOrderListHtml(batches, priceMap, eventName)
  openPdfWindow(htmlContent)
}
