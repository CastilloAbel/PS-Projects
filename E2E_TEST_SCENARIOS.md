# End-to-End Test Scenarios - RBAC Panel

**Date**: May 29, 2026  
**Status**: Ready for Testing  
**Test Environment**: Local Development

---

## Pre-Test Setup

### Default Users
- **admin@ps-project.local** - Full system access (password: admin)
- **user1@ps-project.local** - Regular user (password: user1)
- **user2@ps-project.local** - Regular user (password: user2)
- **viewer@ps-project.local** - Viewer role (password: viewer)

### Demo Data (from seed)
- **Workspace**: "Demo Workspace" (owned by admin)
- **Board**: "Sample Board" (within Demo Workspace)
- **Lists**: "To Do", "In Progress", "Done"
- **Cards**: Multiple cards with different assignments

---

## Test Scenario 1: User Search for Member Addition ✅

**Gap #1 Verification**

### Steps
1. Login as `admin@ps-project.local`
2. Navigate to Demo Workspace → Manage Members tab
3. In the "Add Member" section, type in search box:
   - Search "user1" (minimum 2 chars)
   - Verify dropdown shows matching users
   - Search "user@" shows all users with that email pattern
   - Search "nonexistent" shows no results

### Expected Results
- ✅ Search dropdown appears after 2 characters
- ✅ Results filtered correctly by name/email
- ✅ Already-added members are hidden from results
- ✅ User can click to select from dropdown
- ✅ Selected user shows with avatar preview

### Verification Points
```typescript
// Frontend API: Frontend/src/api/index.ts:85
export const searchUsers = async (query: string): Promise<User[]> => {
  const { data } = await api.get('/users/search', { params: { q: query } });
  return data;
};

// Component Integration: Frontend/src/components/AdvancedRoleManagement.tsx:64-78
const handleSearch = useCallback(async (query: string) => {
  if (query.length < 2) {
    setSearchResults([]);
    return;
  }
  const results = await searchUsers(query);
  const memberEmails = members.map(m => m.user?.email || '').filter(Boolean);
  setSearchResults(results.filter(u => !memberEmails.includes(u.email)));
}, [members]);
```

---

## Test Scenario 2: CardModal Permission Restrictions ✅

**Gap #2 Verification**

### Test 2A: VIEWER Role Cannot Edit

**Steps**
1. Login as `admin@ps-project.local`
2. Add "viewer@ps-project.local" to demo board as **VIEWER**
3. Logout and login as `viewer@ps-project.local`
4. Navigate to Demo Board
5. Click on any card to open CardModal

**Expected Results**
- ✅ Card modal opens
- ✅ Yellow alert banner appears: "Limited Permissions - Can only view this card"
- ✅ Title field is disabled (grayed out, not editable)
- ✅ Description field is disabled
- ✅ Save button is disabled with lock icon
- ✅ Button tooltip shows: "You do not have permission to edit this card"

### Test 2B: COMMENTER Role Cannot Edit

**Steps**
1. Remove viewer from board, add as **COMMENTER**
2. Logout/login as commenter
3. Open card modal

**Expected Results**
- ✅ Alert shows: "Can view and comment, but cannot edit"
- ✅ All edit fields disabled
- ✅ Comment section is enabled

### Test 2C: EDITOR Role Can Only Edit Assigned Cards

**Steps**
1. Add "user1@ps-project.local" to board as **EDITOR**
2. Assign a card to user1
3. Logout/login as user1
4. Open the assigned card

**Expected Results**
- ✅ No alert banner (can edit)
- ✅ All fields enabled
- ✅ Save button enabled
- ✅ Can make and save changes

**Then open an unassigned card**

**Expected Results**
- ✅ Alert shows: "As an Editor, you can only edit cards assigned to you"
- ✅ Fields disabled
- ✅ Cannot edit

### Verification Points
```typescript
// Component: Frontend/src/components/CardModal.tsx:32
const { canEditCard, boardRole } = usePermission();

// Alert Display: Frontend/src/components/CardModal.tsx:97-110
{!canEditCard && (
  <div className="px-4 sm:px-6 py-3 bg-yellow-50 dark:bg-yellow-950 border-b border-yellow-200 dark:border-yellow-800">
    <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
      Limited Permissions
    </p>
    <p className="text-xs text-yellow-800 dark:text-yellow-200">
      {roleSpecificMessage}
    </p>
  </div>
)}

// Field Disabled: Frontend/src/components/CardModal.tsx:87
disabled={!canEditCard}
```

---

## Test Scenario 3: Auto-Add to Workspace When Adding to Board ✅

**Gap #3 Verification**

### Setup
1. Login as admin
2. Create a test user that is NOT in Demo Workspace
3. Go to Demo Board
4. Try to add this user to the board

### Steps
1. Open Demo Board
2. Click "Manage Members" / "Add Member"
3. Search for the new user who is NOT yet a workspace member
4. Select and add as **EDITOR** role to board
5. Verify operation succeeds
6. Navigate back to workspace members

**Expected Results**
- ✅ User is added to board successfully as EDITOR
- ✅ User is automatically added to workspace as MEMBER (not visible to user, but in DB)
- ✅ No error "User must be workspace member first"
- ✅ New user can now access workspace
- ✅ New user has EDITOR role on board

### Backend Verification
**Database Check**
```sql
-- Check workspace membership was created
SELECT * FROM WorkspaceMember 
WHERE userId = '<new_user_id>' 
AND workspaceId = '<demo_workspace_id>';
-- Expected: 1 row with role='MEMBER'

-- Check board membership
SELECT * FROM BoardMember 
WHERE userId = '<new_user_id>' 
AND boardId = '<demo_board_id>';
-- Expected: 1 row with role='EDITOR'
```

### Verification Points
```typescript
// Backend: Backend/src/routes/member.routes.ts:80-102
const workspaceMembership = await prisma.workspaceMember.findUnique({
  where: {
    userId_workspaceId: {
      userId,
      workspaceId: board.workspaceId,
    },
  },
});

if (!workspaceMembership) {
  await prisma.workspaceMember.create({
    data: {
      userId,
      workspaceId: board.workspaceId,
      role: 'MEMBER',
    },
  });
  logger.info(`User ${userId} auto-added to workspace ${board.workspaceId}`);
}
```

---

## Test Scenario 4: Complete Workflow - Create, Assign, Restrict

**Comprehensive End-to-End Test**

### Steps

**Phase 1: Workspace Setup**
1. Login as admin
2. Create new workspace "Test Workspace"
3. Add user1 as ADMIN
4. Add user2 as MEMBER

**Phase 2: Board Setup**
1. Create board "Test Board" in Test Workspace
2. Add 3 lists: "Todo", "Doing", "Done"
3. Create 3 cards:
   - Card A: assigned to user1
   - Card B: assigned to user2
   - Card C: unassigned

**Phase 3: Test EDITOR Restrictions**
1. Add user1 to board as EDITOR
2. Logout → Login as user1
3. Try to edit Card A (assigned to user1)
   - ✅ Should work (no alert)
4. Try to edit Card B (assigned to user2)
   - ✅ Should show alert: "can only edit cards assigned to you"
5. Try to edit Card C (unassigned)
   - ✅ Should show alert about editor restrictions

**Phase 4: Test COMMENTER Restrictions**
1. Logout → Add user2 to board as COMMENTER
2. Logout → Login as user2
3. Try to edit Card B (owned by user2)
   - ✅ Should show alert: "Can view and comment, but cannot edit"
   - ✅ Comment section should be enabled
4. Try to comment
   - ✅ Comment should be posted successfully

**Phase 5: Verify Audit Log**
1. Login as admin
2. Check SecurityModal or Activity Log
3. Verify all operations are logged:
   - User1 added as EDITOR
   - User2 added as COMMENTER
   - Workspace auto-additions (if from outside)

### Expected Results
- ✅ All permission restrictions enforced
- ✅ Users see appropriate alerts
- ✅ Allowed operations succeed
- ✅ Restricted operations fail gracefully
- ✅ All changes audited

---

## Test Scenario 5: Permission Matrix Display

**UI Verification**

### Steps
1. Login as admin
2. Go to workspace or board management
3. Look for "Advanced Role Management" panel
4. Check permission matrix

**Expected Results for Board Roles**
```
Permission          OWNER  ADMIN  EDITOR  COMMENTER  VIEWER
─────────────────────────────────────────────────────────────
View Board            ✓      ✓       ✓         ✓        ✓
Create Card           ✓      ✓       ✓         ✗        ✗
Edit Card             ✓      ✓      ✓*         ✗        ✗
Delete Card           ✓      ✓       ✗         ✗        ✗
Manage Members        ✓      ✓       ✗         ✗        ✗
Comment               ✓      ✓       ✓         ✓        ✗

*EDITOR: only assigned cards
```

**Expected Visual Elements**
- ✅ Color-coded role badges
- ✅ Checkmarks for allowed permissions
- ✅ Cross marks for denied permissions
- ✅ Asterisks for conditional permissions
- ✅ Expandable descriptions

---

## Test Scenario 6: Search and Add Member Flow

**UI/UX Verification**

### Steps
1. Login as admin
2. Open workspace or board management
3. Find member search input field

**Search Input Tests**
- Type "a" → No results shown (< 2 chars)
- Type "ad" → Results appear (≥ 2 chars)
- Type "adm" → Results filtered to matching users
- Type "nonexist123" → Empty results shown
- Clear search → Results cleared
- Select a user → Selected user appears in form
- Click Add → User is added to list

**Expected Results**
- ✅ Search respects minimum 2 character limit
- ✅ Dropdown closes on selection
- ✅ Selected user removed from search results
- ✅ New member appears in members list
- ✅ Role selector works
- ✅ Remove button works

---

## Compilation Status ✅

```
✓ Frontend compiled successfully
  - No TypeScript errors
  - All components resolved
  - 1808 modules bundled
  - Total bundle: 374.04 kB (gzip: 113.10 kB)
```

---

## Critical Path Tests (Run These First)

1. **Gap #1**: Search for user and add to board ✅
2. **Gap #2**: Open card as VIEWER and verify restrictions ✅
3. **Gap #3**: Add user outside workspace to board and verify auto-add ✅

All tests should pass for production deployment.

---

## Known Limitations & Notes

1. **Activity Log Component** - MemberActivityLog is created but needs to be connected to audit log data
2. **Bulk Operations** - Not yet implemented (Phase 2)
3. **Invitation System** - Not yet implemented (Phase 2)
4. **Custom Roles** - Not yet supported (Phase 2)

---

## Success Criteria

All tests pass when:
- ✅ User search works with 2+ character queries
- ✅ Permission restrictions display in CardModal
- ✅ Users auto-added to workspace when added to board
- ✅ Frontend compiles without errors
- ✅ No console errors or warnings
- ✅ UI is responsive (mobile/tablet/desktop)
- ✅ Theme toggle works (light/dark mode)
- ✅ All role badges display correct colors

---

**Test Status**: READY FOR EXECUTION  
**Estimated Time**: 30-45 minutes for full test suite  
**Environment**: Local development with seed data

