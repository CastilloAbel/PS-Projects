# Quick Fix Guide - Backend Silent Crash

## Problem
Server crashes on startup with no output due to TypeScript compilation errors.

## Root Causes
1. Missing files referenced by imports
2. Missing directory structure
3. One anti-pattern with PrismaClient

## Automatic Fix Summary

### Files to Create (7 files)

#### 1. src/db.ts
```typescript
export { prisma } from './prisma';
export { default } from './prisma';
```

#### 2. src/utils/logger.ts
```typescript
import logger from '../logger';
export { logger };
```

#### 3. src/utils/helpers.ts
```typescript
export function getParam(param: string | string[] | undefined): string {
  if (typeof param === 'string') return param;
  if (Array.isArray(param)) return param[0];
  return '';
}
```

#### 4. src/utils/auditLogger.ts
```typescript
export { logAudit } from '../authorization';
```

#### 5. src/middleware/auth.ts
```typescript
export { verifyJWT as requireAuth } from '../middleware';
```

#### 6. src/middleware/authorization.ts
```typescript
export const requireWorkspacePermission = (permission: string) => {
  return async (req: any, res: any, next: any) => {
    // TODO: Implement based on authorization.ts
    next();
  };
};
```

### Files to Fix (3 files)

#### 1. src/routes/member.routes.ts - Line 13
**REMOVE:**
```typescript
const prisma = new PrismaClient();
```

**ADD AT TOP:**
```typescript
import { prisma } from '../prisma';
```

**REMOVE UNUSED:**
```typescript
import { PrismaClient } from '@prisma/client'; // no longer needed
```

#### 2. src/services/emailService.ts - Line 2
**CHANGE FROM:**
```typescript
import { logger } from './logger';
```

**TO:**
```typescript
import logger from '../logger';
```

#### 3. src/index.ts - Lines 68-71
**REPLACE:**
```typescript
app.post('/invitations/:token/accept', async (req: any, res) => {
  const { prisma } = require('./db');
  const { logger } = require('./utils/logger');
  const { getParam } = require('./utils/helpers');
  const { logAudit } = require('./utils/auditLogger');
```

**WITH:**
```typescript
import { prisma } from './prisma';

// ... (at top of file with other imports)

app.post('/invitations/:token/accept', async (req: any, res) => {
  const logger = require('./logger'); // if still needed, or use import
```

## Verification

After fixes:
```bash
cd Backend
npx tsc --noEmit  # Should show 0 errors
npm run dev       # Should start successfully
curl http://localhost:4000/  # Should respond with JSON
```

## Error Messages That Will Disappear

```
Cannot find module '../middleware/auth'
Cannot find module '../middleware/authorization'
Cannot find module '../db'
Cannot find module '../utils/logger'
Cannot find module '../utils/auditLogger'
Cannot find module '../utils/helpers'
Cannot find module './logger' (in emailService.ts)
```

## Files Affected Summary

| File | Issue | Fix |
|------|-------|-----|
| src/routes/invitation.routes.ts | Wrong imports | Fixed by creating missing files |
| src/routes/member.routes.ts | PrismaClient anti-pattern | Use singleton from prisma.ts |
| src/services/emailService.ts | Wrong import path | Update logger import |
| src/index.ts | Dynamic requires | Use static imports |

## Total Changes
- Create: 7 new files
- Modify: 3 files
- Delete: 0 files
- Risk Level: LOW
- Estimated Time: 15-30 minutes
