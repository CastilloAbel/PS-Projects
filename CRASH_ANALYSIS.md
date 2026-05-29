# Backend Server Silent Crash Analysis

## CRITICAL ISSUES FOUND

### 1. MISSING FILES AND MODULES (PRIMARY CAUSE OF SILENT CRASH)

The server crashes silently during TypeScript compilation/import resolution due to missing utility files:

#### Missing Files:
1. **src/db.ts** - index.ts line 68 requires './db' which doesn't exist
2. **src/utils/logger.ts** - invitation.routes.ts line 5 imports from wrong path
3. **src/utils/auditLogger.ts** - invitation.routes.ts line 8 imports non-existent file
4. **src/utils/helpers.ts** - invitation.routes.ts line 9 imports non-existent file

#### Missing Directory:
- **src/middleware/** - invitation.routes.ts lines 2-3 import from non-existent directory

### 2. TYPESCRIPT COMPILATION ERRORS (7 Total)

```
src/routes/invitation.routes.ts(2,29): error TS2307: Cannot find module '../middleware/auth'
src/routes/invitation.routes.ts(3,44): error TS2307: Cannot find module '../middleware/authorization'
src/routes/invitation.routes.ts(4,24): error TS2307: Cannot find module '../db'
src/routes/invitation.routes.ts(5,24): error TS2307: Cannot find module '../utils/logger'
src/routes/invitation.routes.ts(8,26): error TS2307: Cannot find module '../utils/auditLogger'
src/routes/invitation.routes.ts(9,26): error TS2307: Cannot find module '../utils/helpers'
src/services/emailService.ts(2,24): error TS2307: Cannot find module './logger'
```

### 3. PROBLEMATIC CODE PATTERNS

A. **index.ts Lines 67-178** - Inline route with wrong requires
B. **member.routes.ts Line 13** - Creates new PrismaClient() instead of using singleton
C. **invitation.routes.ts Lines 2-9** - All incorrect import paths

### 4. NO CIRCULAR DEPENDENCIES DETECTED ✓

### 5. ALL ROUTE FILES PRESENT ✓

### 6. DATABASE CONNECTION ISSUES
- member.routes.ts creates new PrismaClient() which violates singleton pattern
- index.ts tries to require non-existent './db' file

---

## WHY SERVER CRASHES SILENTLY

1. TypeScript compilation fails with 7 module resolution errors
2. nodemon/ts-node catches error but doesn't display it properly
3. Process exits before any logging occurs
4. Error might be suppressed in certain terminal configurations

---

## REQUIRED FIXES

### Create src/db.ts:
```typescript
export { prisma } from './prisma';
export { default } from './prisma';
```

### Create src/utils/logger.ts:
```typescript
import logger from '../logger';
export { logger };
```

### Create src/utils/helpers.ts:
```typescript
export function getParam(param: string | string[] | undefined): string {
  if (typeof param === 'string') return param;
  if (Array.isArray(param)) return param[0];
  return '';
}
```

### Create src/utils/auditLogger.ts:
```typescript
export { logAudit } from '../authorization';
```

### Create src/middleware/ directory with:

**src/middleware/auth.ts:**
```typescript
export { verifyJWT as requireAuth } from '../middleware';
```

**src/middleware/authorization.ts:**
```typescript
// Placeholder - needs implementation for requireWorkspacePermission
export const requireWorkspacePermission = (permission: string) => {
  return (req: any, res: any, next: any) => next();
};
```

### Fix invitation.routes.ts imports:
```typescript
import { verifyJWT } from '../middleware';
import { prisma } from '../prisma';
import logger from '../logger';
import { logAudit } from '../authorization';
import { getParam } from '../authMiddleware';
```

### Fix member.routes.ts:
- Remove: `const prisma = new PrismaClient();`
- Add: `import { prisma } from '../prisma';`

### Fix emailService.ts:
- Change: `import { logger } from './logger';`
- To: `import logger from '../logger';`

### Fix index.ts:
- Remove: `const { prisma } = require('./db');`
- Add to imports: `import { prisma } from './prisma';`

---

## VERIFICATION

After fixes:
```bash
npx tsc --noEmit    # Should show 0 errors
npm run dev         # Should start successfully
curl http://localhost:4000/  # Should respond
```
