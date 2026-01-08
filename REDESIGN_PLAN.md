# Batch Calculator Redesign Plan

## Overview
Redesign the batch-calculator page to use a single multi-select search bar at the top for adding cocktails, hide batch totals by default, and remove the "Add New Cocktail Slot" button.

## Changes Required

### 1. Create Multi-Select Search Bar Component
- **New Component**: `MultiSelectCocktailSearch.tsx`
  - Location: `src/components/ui/multi-select-cocktail-search.tsx`
  - Features:
    - Single search input at the top
    - Dropdown showing filtered cocktails as user types
    - Ability to select multiple cocktails (checkboxes or multi-select)
    - Selected cocktails displayed as chips/tags that can be removed
    - When a cocktail is selected, automatically create a new batch item
    - Prevent duplicate selections (don't allow same cocktail twice)

### 2. Update Main Page (`app/(tools)/batch-calculator/page.tsx`)
- **Remove**:
  - Individual `CocktailSelector` components from each `BatchItem`
  - "Add New Cocktail Slot" button
  - Auto-initialization of empty batch slot on load
  
- **Add**:
  - `MultiSelectCocktailSearch` component at the top
  - Handler to add batch when cocktail is selected from top search
  - Handler to remove batch when cocktail is deselected from top search
  - State management to sync selected cocktails with batch items

### 3. Update BatchItem Component (`src/features/batch-calculator/components/BatchItem.tsx`)
- **Remove**:
  - `CocktailSelector` component and its props
  - `onSearchTermChange` prop (no longer needed)
  - Search term state from batch (no longer needed)
  
- **Keep**:
  - All other functionality (servings input, ingredient editing, etc.)
  - Remove button (trash icon)

### 4. Update SingleBatchDisplay Component (`src/features/batch-calculator/components/SingleBatchDisplay.tsx`)
- **Add**:
  - Toggle button/checkbox to show/hide "Batch Totals" section
  - State to track visibility of batch totals
  - Default to hidden (collapsed)
  - Smooth expand/collapse animation

### 5. Update Types (`src/features/batch-calculator/types.ts`)
- **Remove**:
  - `searchTerm` field from `BatchState` interface (no longer needed)

### 6. Update BatchItem Props
- Remove `onSearchTermChange` prop from `BatchItem` interface
- Remove `searchTerm` from `BatchState` usage

## Implementation Order

1. Create `MultiSelectCocktailSearch` component
2. Update types to remove `searchTerm`
3. Update `SingleBatchDisplay` to add toggle for batch totals
4. Update `BatchItem` to remove cocktail selector
5. Update main page to use new multi-select search and remove add button
6. Clean up unused code and props

## User Flow

1. User opens page → sees single search bar at top
2. User types cocktail name → sees filtered dropdown
3. User selects cocktail → new batch item appears below automatically
4. User can select multiple cocktails → multiple batch items appear
5. User can remove cocktail from search bar → corresponding batch item is removed
6. Each batch item shows:
   - Cocktail name (editable)
   - Servings input
   - Recipe details
   - Collapsed batch totals (expandable)
7. User can expand batch totals per item if needed
8. Export button remains at bottom

## Technical Considerations

- Ensure selected cocktails in search bar stay in sync with batch items
- Handle edge cases (removing last batch, duplicate prevention)
- Maintain existing calculation logic
- Preserve PDF export functionality
- Keep responsive design
- Maintain performance optimizations (memoization, etc.)
