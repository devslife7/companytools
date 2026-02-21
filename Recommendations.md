Recommendations for Company Tools App
Based on the analysis of the current codebase and industry best practices for catering/bar management tools, here are recommendations to elevate the application to a more professional and user-friendly level.

🎨 UX & UI Improvements
6. Mobile-First "Bar Mode"
Recommendation: A simplified view for bartenders/staff using phones.
Details: Large text, high contrast, just the recipe instructions and "Batch Now" buttons. Disable editing features in this mode.
Benefit: Easier to use on-site during events.
7. Offline Support (PWA)
Recommendation: Convert to a Progressive Web App (PWA).
Details: Cache recipes and saved events locally. Allow viewing and simple calculations without internet.
Benefit: Catering venues often have poor signal.
8. "Smart" Shopping List
Recommendation: Consolidate ingredients across events.
Details: If you have 3 events this week, generate a Master Shopping List that sums up all limes, vodka, etc., needed for all 3 events.
🛠 Technical Improvements
9. User Roles & Permissions
Recommendation: Formalize the "Admin" role.
Details: Use Supabase Auth claims.
Admins: Can edit master recipes and prices.
Staff: Can view recipes and create event batches, but cannot change the master "spec".
10. Automated Testing
Recommendation: Add Unit Tests for calculation logic.
Details: Ensure 
calculations.ts
 is 100% covered. One wrong calculation in catering can mean running out of drinks or massive overstock.
Implementation Roadmap (Suggested Order)
Event Model: Foundation for saving work.
Prep/Sub-recipes: Core value add for kitchen/bar workflow.
Label Printing: High "pro" factor, low effort.
Inventory: High effort, high value.
💰 Money Savings & Profit Maximization
Focusing on the bottom line, these features directly help in reducing costs and increasing margins.

11. Waste & Spillage Log
Concept: "You can't manage what you don't measure."
Feature: A simple interface to log "dumped" batches or spilled bottles.
Savings: Identifies cost leaks. If you see $500 of tequila being wasted monthly, you can change SOPs.
Implementation: A "Report Waste" button that subtracts from Inventory and adds to a "Loss Report".
12. Compare Vendor Prices
Concept: Optimize purchasing power.
Feature: Allow storing prices from multiple vendors (e.g., "Vendor A: $25", "Vendor B: $23").
Savings: The app highlights the cheapest source for your specific shopping list, potentially saving 10-20% on large orders.
13. Menu Engineering / Profitability Heatmap
Concept: Push high-margin drinks.
Feature: Sort recipes not just by name, but by Profit Margin %.
Savings: Visually highlights which drinks make the most money. "The 'Spicy Marg' costs $2 and sells for $16 (87% margin), while 'Old Fashioned' is 60%. Push the Marg."
14. Historical Price Tracking
Concept: Catch inflation.
Feature: Track ingredient costs over time.
Savings: Alert the user: "Limes have gone up 40% in 2 months. Consider switching garnish or raising prices."
15. Exact-Batching Calculator
Concept: Zero leftovers.
Feature: Instead of "Batch 5 Liters", allow inputting "We have $200 budget" or "We have 3 bottles of Gin".
Savings: Prevents making 5L when you only have stock for 4.5L, ensuring 100% of product is monetized without leftover "dead stock".

Comment
⌥⌘M
