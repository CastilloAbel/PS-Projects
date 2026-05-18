# Testing Guide - RBAC System

## Prerequisites

Ensure database is running and migrations are applied:
```bash
cd Backend
npx prisma migrate deploy
```

## Running Tests

### Run all authorization tests
```bash
cd Backend
npm test
```

### Run tests in watch mode (auto-reload on changes)
```bash
npm run test:watch
```

### Generate coverage report
```bash
npm run test:coverage
```

## Test Structure

**Location**: `Backend/src/__tests__/`

**Files**:
- `authorization.test.ts` - 50+ test cases for all authorization functions
- `test-utils.ts` - Helper functions for creating test data
- `setup.ts` - Jest configuration and global setup

## Test Categories

### 1. Workspace Role Checks
- ✓ Identify workspace owner
- ✓ Identify non-owner as not owner
- ✓ Identify workspace admin
- ✓ Identify workspace owner as admin
- ✓ Identify member as not admin
- ✓ Identify workspace member
- ✓ Reject non-member

### 2. Board Role Checks
- ✓ Identify board owner
- ✓ Reject non-owner as board owner
- ✓ Return null for user without board membership
- ✓ Return board role for board member
- ✓ Return OWNER for board creator

### 3. Board Permission Checks
- ✓ OWNER can view board
- ✓ OWNER can create cards
- ✓ ADMIN can edit cards
- ✓ ADMIN can manage members
- ✓ EDITOR can create cards
- ✓ EDITOR can edit cards
- ✓ EDITOR cannot delete cards
- ✓ EDITOR cannot manage members

### 4. Card Edit Restrictions
- ✓ OWNER can edit any card
- ✓ ADMIN can edit any card
- ✓ EDITOR cannot edit unassigned card
- ✓ EDITOR can edit assigned card

### 5. Card View Permissions
- ✓ Board member can view cards
- ✓ Non-board member cannot view card

### 6. Comment Permissions
- ✓ Board member can comment
- ✓ COMMENTER role can comment
- ✓ Comment owner can delete own comment
- ✓ Non-owner cannot delete comment
- ✓ Board admin can delete any comment

### 7. Comment Owner Check
- ✓ Identify comment owner
- ✓ Reject non-owner

## Test Execution Flow

1. **Setup Phase**:
   - Create 3 test users (user1, user2, user3)
   - Create workspace with user1 as OWNER
   - Add user2 as ADMIN, user3 as MEMBER
   - Create board with user1 as owner
   - Create list and cards for testing

2. **Test Phase**:
   - Execute test cases against created entities
   - Verify permissions are enforced correctly
   - Check role assignments are accurate

3. **Cleanup Phase**:
   - Delete all test data in reverse order
   - Clear database state
   - Run next test with clean slate

## Manual Testing Checklist

### Authentication Flow
- [ ] User can login with email/password
- [ ] User receives JWT in httpOnly cookie
- [ ] User can logout and cookie is cleared
- [ ] Google OAuth login works
- [ ] User can access protected endpoints with valid token
- [ ] User gets 401 without valid token

### Workspace Management
- [ ] Owner can create workspace
- [ ] Owner is automatically OWNER role
- [ ] Owner can add members
- [ ] Owner can promote member to ADMIN
- [ ] Owner can remove members
- [ ] Admin can manage members (add/remove/promote)
- [ ] Member cannot manage members
- [ ] Non-member cannot access workspace

### Board Management
- [ ] Workspace member can create board in workspace
- [ ] Creator becomes board OWNER
- [ ] Owner can add board members
- [ ] Owner can set different roles (ADMIN, EDITOR, COMMENTER, VIEWER)
- [ ] ADMIN can manage board members
- [ ] EDITOR cannot manage board members
- [ ] VIEWER can only view, cannot create cards

### Card Operations
- [ ] OWNER can create cards
- [ ] ADMIN can create cards
- [ ] EDITOR can create cards
- [ ] COMMENTER cannot create cards
- [ ] VIEWER cannot create cards
- [ ] OWNER can edit any card
- [ ] ADMIN can edit any card
- [ ] EDITOR can only edit assigned cards
- [ ] COMMENTER cannot edit cards
- [ ] VIEWER cannot edit cards

### Comments
- [ ] OWNER can comment
- [ ] ADMIN can comment
- [ ] EDITOR can comment
- [ ] COMMENTER can comment
- [ ] VIEWER cannot comment
- [ ] Owner can delete own comment
- [ ] Admin can delete any comment
- [ ] User cannot delete others' comments

### Audit Logging
- [ ] Create board logs "CREATE" action
- [ ] Update board logs "UPDATE" action
- [ ] Delete board logs "DELETE" action
- [ ] Log includes userId, action, entity, changes
- [ ] Log includes ipAddress and userAgent
- [ ] All member changes are logged

### UI Components
- [ ] MemberManagement component loads members
- [ ] Can add members (admin only)
- [ ] Can edit member roles (admin only)
- [ ] Can remove members (admin only)
- [ ] Cannot remove owner
- [ ] BoardSettings modal opens/closes
- [ ] Permission matrix displays correctly
- [ ] Board name can be edited (admin)

## Expected Test Output

```
PASS  src/__tests__/authorization.test.ts (5.234 s)
  Authorization Tests
    Workspace Role Checks
      ✓ should identify workspace owner (12 ms)
      ✓ should identify non-owner as not owner (8 ms)
      ...
    Board Role Checks
      ✓ should identify board owner (9 ms)
      ...
    Board Permission Checks
      ✓ OWNER can view board (7 ms)
      ...

Test Suites: 1 passed, 1 total
Tests:       50 passed, 50 total
Snapshots:   0 total
Time:        6.234 s
```

## Common Test Issues

### Issue: "Cannot find module '@prisma/client'"
**Solution**: Run `npm install` in Backend directory

### Issue: "Database connection failed"
**Solution**: Ensure PostgreSQL is running and DATABASE_URL is set

### Issue: "Port already in use"
**Solution**: Kill process on port or change test database

### Issue: "Migration not applied"
**Solution**: Run `npx prisma migrate deploy` before tests

## Debugging Tests

### View detailed test output
```bash
npm test -- --verbose
```

### Run specific test file
```bash
npm test authorization.test.ts
```

### Run specific test case
```bash
npm test -- -t "should identify workspace owner"
```

### Debug mode (opens V8 inspector)
```bash
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

## Performance Baseline

Current test suite performance:
- Total execution time: ~6 seconds
- Average test case: ~120ms
- Database operations: ~50ms per operation
- Memory usage: ~150MB

## Continuous Integration

For CI/CD pipelines:

```bash
# Run tests with coverage
npm run test:coverage

# Check coverage thresholds
npm run test:coverage -- --coverage-threshold='{
  "branches": 80,
  "functions": 80,
  "lines": 80,
  "statements": 80
}'

# Generate HTML report
npm run test:coverage -- --coverage-reporters=html
```

## Database Test Isolation

Tests use transaction isolation to prevent conflicts:
- Each test gets clean database state
- Cleanup function removes all test data
- No data persists between test runs
- Safe to run tests multiple times

## Adding New Tests

To add a new test case:

1. Create function in `test-utils.ts` if needed:
```typescript
export async function createTestScenario() {
  // Setup code
}
```

2. Add test to `authorization.test.ts`:
```typescript
it('should do something', async () => {
  const result = await someFunction(testData);
  expect(result).toBe(true);
});
```

3. Run tests:
```bash
npm test -- -t "should do something"
```

---

**Last Updated**: May 18, 2026
**Status**: Ready for Testing
