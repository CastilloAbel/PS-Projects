# RBAC System - Detailed File Reference Guide

## BACKEND AUTHORIZATION FILES

### 1. Core Authorization Module
**File**: `Backend/src/authorization.ts` (342 lines)

#### Workspace Authorization Functions
| Function | Lines | Purpose |
|----------|-------|---------|
| `isWorkspaceOwner(userId, workspaceId)` | 19-30 | Check if user is workspace OWNER |
| `isWorkspaceAdmin(userId, workspaceId)` | 35-46 | Check if user is OWNER or ADMIN |
| `isWorkspaceMember(userId, workspaceId)` | 51-62 | Check if user has any membership |
| `getWorkspaceRole(userId, workspaceId)` | 302-313 | Retrieve workspace role (OWNER/ADMIN/MEMBER) |

#### Board Authorization Functions
| Function | Lines | Purpose |
|----------|-------|---------|
| `isBoardOwner(userId, boardId)` | 67-76 | Check if user created board |
| `getBoardRole(userId, boardId)` | 81-102 | Get user's board role (returns null if no access) |
| `canUserDoInBoard(userId, boardId, action)` | 107-128 | Check if action permitted for role |
| `canEditCard(userId, cardId)` | 136-169 | OWNER/ADMIN→any card, EDITOR→assigned only |
| `canViewCard(userId, cardId)` | 184-204 | Check VIEW permission |
| `canCommentCard(userId, cardId)` | 209-229 | Check COMMENT permission |
| `canDeleteComment(userId, commentId)` | 248-279 | Check DELETE (owner or board admin) |

#### Utility Functions
| Function | Lines | Purpose |
|----------|-------|---------|
| `isCommentOwner(userId, commentId)` | 234-243 | Check comment ownership |
| `isTagInWorkspace(userId, tagId)` | 284-297 | Check workspace membership for tag access |
| `logAudit(userId, action, entity, entityId, changes, req)` | 318-341 | Non-blocking audit logging |

#### Permission Matrix
Location: Lines 119-125
```
OWNER: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE_MEMBERS', 'COMMENT']
ADMIN: ['VIEW', 'CREATE', 'EDIT', 'MANAGE_MEMBERS', 'COMMENT']
EDITOR: ['VIEW', 'CREATE', 'EDIT', 'COMMENT']
COMMENTER: ['VIEW', 'COMMENT']
VIEWER: ['VIEW']
```

---

### 2. Authorization Middleware
**File**: `Backend/src/authMiddleware.ts` (211 lines)

#### Middleware Functions

| Middleware | Lines | Purpose |
|-----------|-------|---------|
| `requireWorkspaceAccess()` | 9-42 | Verify workspace membership, attach `req.workspaceRole` |
| `requireBoardAccess()` | 47-112 | Verify board access with workspace check, attach `req.boardRole` |
| `requireBoardPermission(action)` | 117-151 | Factory middleware for action-based checks |
| `requireBoardOwner()` | 156-180 | Restrict to board owner only |
| `requireWorkspaceAdmin()` | 185-210 | Restrict to workspace OWNER or ADMIN |

#### Key Features
- Line 71-75: Check workspace membership before board access
- Line 86-102: Compute board role (owner → OWNER role)
- Line 138-142: Return 403 if permission denied
- Line 30-31, 77-79, 96, 138-139, 201: Log warnings on permission denial

---

## BACKEND ROUTE FILES

### 3. Workspace Routes
**File**: `Backend/src/routes/workspace.routes.ts` (195 lines)

| Endpoint | Method | Lines | Permission Check | Audit Log |
|----------|--------|-------|------------------|-----------|
| `/workspaces` | GET | 9-64 | Auto-filter membership | L32 |
| `/workspaces/:id` | GET | 40-78 | Manual (L47-57) | L72 |
| `/workspaces` | POST | 81-119 | None (auto OWNER) | L111 |
| `/workspaces/:id` | PATCH | 122-152 | Manual (L129-139) | L149 |
| `/workspaces/:id` | DELETE | 155-195 | Implied OWNER | L170 |

**Key Features**:
- Line 15-30: Query with member filter for user
- Line 93-101: Auto-create WorkspaceMember with OWNER role
- Line 129-139: Check role before update

---

### 4. Board Routes
**File**: `Backend/src/routes/board.routes.ts` (262 lines)

| Endpoint | Method | Lines | Permission | Check |
|----------|--------|-------|-----------|-------|
| `/boards` | GET | 9-64 | Any board member | Filter L14-30 |
| `/boards/:id` | GET | 67-136 | VIEW | `canUserDoInBoard()` L73 |
| `/boards` | POST | 139-... | Workspace member | Manual L150 |
| `/boards/:id` | PATCH | | EDIT | Check varies |
| `/boards/:id` | DELETE | | OWNER | Check varies |

**Key Features**:
- Line 14-30: Complex query with 3 OR conditions (owner, board member, workspace member)
- Line 73: `canUserDoInBoard()` enforces VIEW permission
- Line 111-122: Include board members in response

---

### 5. Card Routes
**File**: `Backend/src/routes/card.routes.ts` (412 lines)

| Endpoint | Method | Lines | Permission | Check |
|----------|--------|-------|-----------|-------|
| `/cards` | POST | 9-76 | CREATE | `canCreateCard()` L30 |
| `/cards/:id` | GET | 79-131 | VIEW | `canViewCard()` L85 |
| `/cards/:id/move` | PATCH | 134-183 | EDIT | `canEditCard()` L146 |
| `/cards/:id` | PATCH | 186-... | EDIT | `canEditCard()` L193 |
| `/cards/:id` | DELETE | | DELETE | Manual Owner/Admin |

**Critical Features**:
- Line 30-35: Check CREATE permission before creation
- Line 85: Check VIEW before returning card details
- Line 146-151: Check EDIT for card movement
- Line 68: `logAudit()` for tracking
- Line 193-198: Check EDIT before update

**Special**: EDITOR restriction checked in authorization.ts L163-166

---

### 6. Comment Routes
**File**: `Backend/src/routes/comment.routes.ts` (227 lines)

| Endpoint | Method | Lines | Permission | Check |
|----------|--------|-------|-----------|-------|
| `/comments` | POST | 9-65 | COMMENT | `canCommentCard()` L23 |
| `/comments` | GET | 68-126 | VIEW + board access | Manual L95-103 |
| `/comments/:id` | PATCH | 129-175 | Owner comment | Check L148 |
| `/comments/:id` | DELETE | | Owner or Admin | `canDeleteComment()` |

**Key Features**:
- Line 23-27: Enforce COMMENT permission
- Line 57: `logAudit()` CREATE action
- Line 95-103: Verify board access before returning comments
- Line 148: Check comment ownership

---

### 7. List Routes
**File**: `Backend/src/routes/list.routes.ts` (140 lines)

| Endpoint | Method | Lines | Permission | Check |
|----------|--------|-------|-----------|-------|
| `/lists` | POST | 9-52 | CREATE | `canUserDoInBoard()` L29 |
| `/lists/:id` | PATCH | 55-95 | EDIT | `canUserDoInBoard()` L72 |
| `/lists/:id` | DELETE | 98-138 | DELETE (Owner/Admin) | Manual L114-124 |

**Features**:
- Line 29: CREATE permission check
- Line 72: EDIT permission check
- Line 114-124: Manual Owner/Admin check for DELETE
- Line 44, 87, 130: `logAudit()` calls

---

### 8. Tag Routes
**File**: `Backend/src/routes/tag.routes.ts` (195 lines)

| Endpoint | Method | Lines | Permission | Check |
|----------|--------|-------|-----------|-------|
| `/tags` | POST | 9-49 | Workspace Admin | `isWorkspaceAdmin()` L24 |
| `/tags` | GET | 52-79 | Workspace member | `isWorkspaceMember()` L62 |
| `/tags/:id` | GET | 82-115 | Workspace member | `isWorkspaceMember()` L103 |
| `/tags/:id` | PATCH | 118-156 | Workspace Admin | `isWorkspaceAdmin()` L135 |
| `/tags/:id` | DELETE | | Workspace Admin | `isWorkspaceAdmin()` |

**Features**:
- Line 24: Admin check for CREATE
- Line 62: Member check for GET list
- Line 103: Member check for GET single
- Line 135: Admin check for UPDATE
- Line 19-21: HEX color validation

---

### 9. Member Management Routes
**File**: `Backend/src/routes/member.routes.ts` (652 lines)

#### Board Members Section (Lines 22-337)

| Endpoint | Method | Lines | Middleware | Key Features |
|----------|--------|-------|-----------|--------------|
| `POST /boards/:id/members` | POST | 27-119 | `requireBoardPermission('MANAGE_MEMBERS')` | L93-104 audit log |
| `GET /boards/:id/members` | GET | 124-196 | `requireBoardPermission('VIEW')` | L172-181 include owner |
| `PATCH /boards/:id/members/:userId` | PATCH | 201-276 | `requireBoardPermission('MANAGE_MEMBERS')` | L229 protect owner |
| `DELETE /boards/:id/members/:userId` | DELETE | 281-337 | `requireBoardPermission('MANAGE_MEMBERS')` | L300 protect owner |

**Key Protections**:
- Line 229: Cannot change board owner role
- Line 300: Cannot remove board owner
- Line 172-181: Include board owner in member list even without BoardMember record
- Line 41-44, 215-218, 519: Role validation

#### Workspace Members Section (Lines 339-650)

| Endpoint | Method | Lines | Middleware | Key Features |
|----------|--------|-------|
