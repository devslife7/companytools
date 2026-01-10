# Recipe Management Plan: Add & Edit Cocktails with Database Persistence

## Overview
This plan outlines the implementation of full CRUD (Create, Read, Update, Delete) functionality for cocktail recipes with database persistence.

## Current State Analysis

### ✅ What Already Exists
1. **Database Schema**: Cocktails and ingredients tables with relationships
2. **API Endpoints**: 
   - `POST /api/cocktails` - Create cocktail
   - `PUT /api/cocktails/[id]` - Update cocktail
   - `DELETE /api/cocktails/[id]` - Delete cocktail
3. **UI Component**: `EditRecipeModal` component exists for editing
4. **Local Editing**: Recipes can be edited in batch calculator (but not persisted)

### ❌ What's Missing
1. **Database Integration**: EditRecipeModal doesn't save to database
2. **Add New Recipe**: No UI for creating new recipes
3. **Delete Functionality**: No UI for deleting recipes
4. **Recipe Management Page**: No dedicated page for managing recipes
5. **Optimistic Updates**: No UI feedback during save operations
6. **Error Handling**: Limited error handling for API operations
7. **Recipe ID Tracking**: Need to track database IDs for updates

## Implementation Plan

---

## Phase 1: Update Data Models & Types

### 1.1 Extend CocktailRecipe Type
**File**: `src/features/batch-calculator/types.ts`

Add optional `id` field to track database ID:
```typescript
export interface CocktailRecipe {
  id?: number  // Database ID (optional for backward compatibility)
  name: string
  garnish: string
  method: string
  ingredients: Ingredient[]
}
```

### 1.2 Update BatchState
Ensure `selectedCocktail` includes database ID when available.

---

## Phase 2: Create API Hooks for Mutations

### 2.1 Create Mutation Hooks
**File**: `src/features/batch-calculator/hooks/useCocktailMutations.ts`

Create hooks for:
- `useCreateCocktail()` - Create new recipe
- `useUpdateCocktail()` - Update existing recipe
- `useDeleteCocktail()` - Delete recipe

**Features**:
- Optimistic updates
- Error handling
- Loading states
- Refetch cocktails list after mutations

**Example Structure**:
```typescript
export function useCreateCocktail() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const createCocktail = async (data: Omit<CocktailRecipe, 'id'>) => {
    // Implementation with API call
  }
  
  return { createCocktail, loading, error }
}
```

---

## Phase 3: Enhance EditRecipeModal Component

### 3.1 Update EditRecipeModal
**File**: `src/features/batch-calculator/components/EditRecipeModal.tsx`

**Changes**:
1. Add `cocktailId` prop (optional, for edit vs create mode)
2. Integrate `useUpdateCocktail` hook
3. Add loading state during save
4. Add error display
5. Call `onSave` callback with updated recipe
6. Show success message after save

**Props Update**:
```typescript
interface EditRecipeModalProps {
  isOpen: boolean
  onClose: () => void
  recipe: CocktailRecipe | null
  cocktailId?: number  // Database ID if editing existing
  onSave: (updatedRecipe: CocktailRecipe) => void
  onSaveSuccess?: () => void  // Callback after successful save
}
```

---

## Phase 4: Create Add Recipe Modal Component

### 4.1 Create AddRecipeModal Component
**File**: `src/features/batch-calculator/components/AddRecipeModal.tsx`

**Features**:
- Reuse EditRecipeModal logic (or create shared base component)
- Empty form for new recipe
- Validation for required fields
- Integrate `useCreateCocktail` hook
- Success feedback

**Alternative**: Extend EditRecipeModal to handle both create and edit modes.

---

## Phase 5: Add Recipe Management UI

### 5.1 Add "Add Recipe" Button
**Location**: `app/(tools)/batch-calculator/page.tsx`

**Placement Options**:
- Top of page, next to search bar
- In a new "Recipe Management" section
- Floating action button

### 5.2 Add Edit Button to BatchItem
**File**: `src/features/batch-calculator/components/BatchItem.tsx`

**Features**:
- "Edit Recipe" button that opens EditRecipeModal
- Only show if cocktail has database ID
- Save changes to database, then update local state

### 5.3 Add Delete Functionality
**Location**: EditRecipeModal or separate delete confirmation modal

**Features**:
- Delete button in EditRecipeModal
- Confirmation dialog before deletion
- Remove from database
- Update cocktails list after deletion

---

## Phase 6: Update Batch Calculator Page

### 6.1 Integrate Mutations
**File**: `app/(tools)/batch-calculator/page.tsx`

**Changes**:
1. Import mutation hooks
2. Add state for Add/Edit modals
3. Handle save callbacks
4. Refetch cocktails after mutations
5. Update local state optimistically

**New State**:
```typescript
const [showAddModal, setShowAddModal] = useState(false)
const [showEditModal, setShowEditModal] = useState(false)
const [editingCocktail, setEditingCocktail] = useState<CocktailRecipe | null>(null)
const [editingCocktailId, setEditingCocktailId] = useState<number | undefined>()
```

### 6.2 Handle Save Operations
**Functions to Add**:
- `handleCreateCocktail` - Create new recipe
- `handleUpdateCocktail` - Update existing recipe
- `handleDeleteCocktail` - Delete recipe
- `handleRefreshCocktails` - Refetch from database

---

## Phase 7: Recipe Management Page (Optional)

### 7.1 Create Dedicated Management Page
**File**: `app/(tools)/recipe-manager/page.tsx`

**Features**:
- List all recipes in a table/card view
- Search and filter recipes
- Add/Edit/Delete actions
- Bulk operations (future)
- Recipe categories/tags management (future)

**Benefits**:
- Centralized recipe management
- Better UX for managing many recipes
- Separates batch calculator from recipe management

---

## Phase 8: Error Handling & User Feedback

### 8.1 Toast Notifications
**Option**: Use a toast library or create custom toast component

**Notifications Needed**:
- ✅ "Recipe saved successfully"
- ❌ "Failed to save recipe"
- ❌ "Recipe name already exists"
- ✅ "Recipe deleted successfully"
- ⚠️ "Please fill in all required fields"

### 8.2 Loading States
- Disable form during save
- Show spinner on save button
- Disable other actions during save

### 8.3 Validation
- Client-side validation before API call
- Server-side validation (already in API)
- Display validation errors clearly

---

## Phase 9: Optimistic Updates

### 9.1 Update UI Immediately
**Strategy**:
1. Update local state immediately when user saves
2. Make API call in background
3. Revert if API call fails
4. Show error message if reversion needed

**Benefits**:
- Instant feedback
- Better perceived performance
- Smooth user experience

---

## Phase 10: Data Synchronization

### 10.1 Refresh After Mutations
**Strategy**:
- After create/update/delete, refetch cocktails list
- Update `availableCocktails` state
- Update selected cocktails if they were modified

### 10.2 Handle Conflicts
**Scenarios**:
- Recipe deleted while being edited
- Recipe modified by another user
- Name conflict on update

**Solutions**:
- Check if recipe still exists before update
- Show conflict resolution UI
- Allow user to refresh and see latest version

---

## Implementation Steps

### Step 1: Foundation (30 min)
- [ ] Update types to include optional `id`
- [ ] Create mutation hooks (`useCreateCocktail`, `useUpdateCocktail`, `useDeleteCocktail`)
- [ ] Test hooks with API endpoints

### Step 2: Edit Functionality (1 hour)
- [ ] Update `EditRecipeModal` to save to database
- [ ] Add loading/error states to modal
- [ ] Integrate with batch calculator page
- [ ] Test edit flow end-to-end

### Step 3: Add Functionality (1 hour)
- [ ] Create `AddRecipeModal` or extend `EditRecipeModal`
- [ ] Add "Add Recipe" button to UI
- [ ] Integrate create mutation
- [ ] Test add flow end-to-end

### Step 4: Delete Functionality (30 min)
- [ ] Add delete button to EditRecipeModal
- [ ] Create confirmation dialog
- [ ] Integrate delete mutation
- [ ] Test delete flow end-to-end

### Step 5: Polish & Error Handling (1 hour)
- [ ] Add toast notifications
- [ ] Improve error messages
- [ ] Add loading states
- [ ] Test error scenarios

### Step 6: Testing & Refinement (1 hour)
- [ ] Test all CRUD operations
- [ ] Test error cases
- [ ] Test with multiple users (if applicable)
- [ ] Performance testing
- [ ] UI/UX improvements

---

## File Structure

```
src/features/batch-calculator/
├── components/
│   ├── EditRecipeModal.tsx        # Enhanced with DB save
│   ├── AddRecipeModal.tsx         # New component
│   └── DeleteConfirmModal.tsx     # New component (optional)
├── hooks/
│   ├── useCocktails.ts            # Existing
│   ├── useCocktail.ts             # Existing
│   ├── useSearchCocktails.ts      # Existing
│   └── useCocktailMutations.ts    # New - CRUD mutations
└── types.ts                        # Updated with id field

app/(tools)/
├── batch-calculator/
│   └── page.tsx                    # Updated with mutations
└── recipe-manager/                 # Optional new page
    └── page.tsx
```

---

## API Integration Details

### Create Recipe
```typescript
POST /api/cocktails
Body: { name, garnish, method, ingredients[], category?, tags? }
Response: CocktailRecipe (with id)
```

### Update Recipe
```typescript
PUT /api/cocktails/[id]
Body: { name?, garnish?, method?, ingredients[], category?, tags? }
Response: CocktailRecipe
```

### Delete Recipe
```typescript
DELETE /api/cocktails/[id]
Response: { success: true }
```

---

## User Flow Diagrams

### Add New Recipe Flow
```
User clicks "Add Recipe" 
  → Modal opens with empty form
  → User fills in recipe details
  → User clicks "Save"
  → Loading state shown
  → API call to POST /api/cocktails
  → Success: Close modal, refresh list, show toast
  → Error: Show error message, keep modal open
```

### Edit Recipe Flow
```
User clicks "Edit" on a recipe
  → Modal opens with current recipe data
  → User modifies recipe details
  → User clicks "Save"
  → Loading state shown
  → API call to PUT /api/cocktails/[id]
  → Success: Close modal, refresh list, update batch if active, show toast
  → Error: Show error message, keep modal open
```

### Delete Recipe Flow
```
User clicks "Delete" in EditRecipeModal
  → Confirmation dialog appears
  → User confirms deletion
  → Loading state shown
  → API call to DELETE /api/cocktails/[id]
  → Success: Close modal, refresh list, remove from batches if active, show toast
  → Error: Show error message, keep modal open
```

---

## Edge Cases & Considerations

### 1. Recipe in Active Batch
- If recipe is being used in a batch, warn user before delete
- Option to cancel batch or proceed with delete
- Update batch state if recipe is deleted

### 2. Name Conflicts
- Check for duplicate names on create
- Allow name change on update (check for conflicts)
- Show clear error message

### 3. Network Failures
- Retry logic for failed requests
- Offline detection
- Queue mutations if offline (future)

### 4. Concurrent Edits
- Last-write-wins (simple approach)
- Could add versioning later (optimistic locking)

### 5. Empty Ingredients
- Validate at least one ingredient
- Prevent saving empty ingredients
- Clear validation errors

---

## Success Criteria

✅ Users can create new recipes that persist to database
✅ Users can edit existing recipes and save changes to database
✅ Users can delete recipes from database
✅ Changes reflect immediately in the UI
✅ Error states are handled gracefully
✅ Loading states provide good feedback
✅ Recipes sync across the application
✅ No data loss during operations

---

## Future Enhancements

1. **Recipe Versioning**: Track recipe history and changes
2. **Bulk Operations**: Edit/delete multiple recipes at once
3. **Recipe Categories**: Organize recipes by category
4. **Recipe Tags**: Add tags for better organization
5. **Recipe Import/Export**: Import/export recipes as JSON
6. **Recipe Templates**: Create templates for common recipes
7. **Recipe Sharing**: Share recipes with other users (if multi-user)
8. **Recipe Favorites**: Mark favorite recipes
9. **Recipe Search**: Advanced search with filters
10. **Recipe Analytics**: Track most used recipes

---

## Testing Checklist

- [ ] Create new recipe with valid data
- [ ] Create recipe with duplicate name (should fail)
- [ ] Create recipe with empty fields (should validate)
- [ ] Edit existing recipe and save
- [ ] Edit recipe name to duplicate (should fail)
- [ ] Delete recipe
- [ ] Delete recipe that's in active batch (should warn)
- [ ] Network error during save (should show error)
- [ ] Save with invalid ingredient data
- [ ] Refresh page after save (should persist)
- [ ] Multiple rapid saves (should handle correctly)

---

## Timeline Estimate

- **Phase 1-2**: Foundation (1-2 hours)
- **Phase 3-4**: Edit & Add UI (2-3 hours)
- **Phase 5**: Delete & Management (1 hour)
- **Phase 6**: Integration (1-2 hours)
- **Phase 7**: Optional Management Page (2-3 hours)
- **Phase 8-9**: Polish & Optimization (1-2 hours)
- **Phase 10**: Testing (1 hour)

**Total**: 9-14 hours of development time

---

## Notes

- Start with Edit functionality (most important)
- Then Add functionality
- Then Delete functionality
- Polish and error handling throughout
- Consider user feedback and iterate on UX
