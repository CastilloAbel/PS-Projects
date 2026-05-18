# Frontend Integration Guide - RBAC System

## Overview

This guide explains how to integrate the new PermissionContext and UI components into existing frontend components.

## Quick Start

### 1. Permission Context is Already Set Up

The `PermissionProvider` is already wrapped around your app in `App.tsx`. All components can now use permission hooks.

### 2. Using Permission Context in Components

```typescript
import { usePermission } from '../context/PermissionContext';

function MyComponent() {
  const { 
    canCreateCard, 
    canEditCard, 
    canManageBoardMembers,
    isBoardAdmin,
    boardRole 
  } = usePermission();

  return (
    <div>
      {canCreateCard && <button>Create Card</button>}
      {isBoardAdmin && <button>Manage Members</button>}
      <p>Your role: {boardRole}</p>
    </div>
  );
}
```

## Integration Examples

### 1. Update Board Component to Set Permission Context

**File**: `Frontend/src/components/Board.tsx`

```typescript
import { usePermission } from '../context/PermissionContext';

export const Board: React.FC<{ boardId: string }> = ({ boardId }) => {
  const { setBoardContext, setWorkspaceContext } = usePermission();
  
  useEffect(() => {
    // When board loads, set the context
    const userRole = calculateUserRole(boardId); // Your function
    setBoardContext(boardId, userRole as BoardRole);
    
    return () => {
      setBoardContext(null, null); // Clean up on unmount
    };
  }, [boardId, setBoardContext]);

  return (
    // Your board content
  );
};
```

### 2. Conditional Card Creation Button

**File**: `Frontend/src/components/CardList.tsx`

```typescript
import { usePermission } from '../context/PermissionContext';

export const CardList: React.FC = () => {
  const { canCreateCard } = usePermission();

  return (
    <div>
      {canCreateCard ? (
        <button onClick={createCard}>+ Add Card</button>
      ) : (
        <p className="text-gray-400">You don't have permission to create cards</p>
      )}
      {/* Rest of component */}
    </div>
  );
};
```

### 3. Show Board Settings Button

**File**: `Frontend/src/components/BoardHeader.tsx`

```typescript
import { useState } from 'react';
import { Settings } from 'lucide-react';
import { usePermission } from '../context/PermissionContext';
import { BoardSettings } from './BoardSettings';

export const BoardHeader: React.FC<{ boardId: string; boardName: string }> = ({ 
  boardId, 
  boardName 
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const { canManageBoardMembers, isBoardAdmin, boardRole } = usePermission();

  return (
    <>
      <div className="flex items-center justify-between p-4">
        <h1>{boardName}</h1>
        {isBoardAdmin && (
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>

      {showSettings && (
        <BoardSettings
          boardId={boardId}
          boardName={boardName}
          currentUserRole={boardRole}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
};
```

### 4. Conditional Card Edit/Delete

**File**: `Frontend/src/components/Card.tsx`

```typescript
import { usePermission } from '../context/PermissionContext';

interface CardProps {
  card: Card;
  onEdit: (card: Card) => void;
  onDelete: (cardId: string) => void;
}

export const Card: React.FC<CardProps> = ({ card, onEdit, onDelete }) => {
  const { canEditCard, canDeleteCard, boardRole } = usePermission();

  return (
    <div className="card">
      <h3>{card.title}</h3>
      <div className="actions">
        {canEditCard && (
          <button onClick={() => onEdit(card)}>Edit</button>
        )}
        {canDeleteCard && (
          <button onClick={() => onDelete(card.id)}>Delete</button>
        )}
      </div>
    </div>
  );
};
```

### 5. Comment Permissions

**File**: `Frontend/src/components/CommentSection.tsx`

```typescript
import { usePermission } from '../context/PermissionContext';

export const CommentSection: React.FC<{ cardId: string }> = ({ cardId }) => {
  const { canCommentCard } = usePermission();

  return (
    <div className="comments">
      {canCommentCard ? (
        <textarea placeholder="Add a comment..." />
      ) : (
        <p className="text-gray-500">You don't have permission to comment</p>
      )}
      {/* Comments list */}
    </div>
  );
};
```

## API Integration

### Update Board Data with Member Info

When fetching a board, also get members:

```typescript
async function fetchBoardWithMembers(boardId: string) {
  const [board, members] = await Promise.all([
    fetch(`/api/boards/${boardId}`).then(r => r.json()),
    fetch(`/api/boards/${boardId}/members`).then(r => r.json()),
  ]);

  return { board, members };
}
```

### Set User Role from API Response

```typescript
async function loadBoard(boardId: string) {
  const response = await fetch(`/api/boards/${boardId}`, {
    credentials: 'include',
  });
  
  const board = await response.json();
  const userBoardMember = board.members?.find(m => m.userId === currentUserId);
  const role = userBoardMember?.role || null;
  
  setBoardContext(boardId, role as BoardRole);
}
```

## Type Safety

All types are exported from `Frontend/src/types/index.ts`:

```typescript
import type { 
  BoardRole, 
  WorkspaceRole, 
  BoardMember, 
  WorkspaceMember 
} from '../types';

function handleRoleChange(newRole: BoardRole) {
  // TypeScript ensures only valid roles
}
```

## Complete Example Component

```typescript
import React, { useEffect, useState } from 'react';
import { usePermission } from '../context/PermissionContext';
import { MemberManagement } from './MemberManagement';
import type { Board as BoardType } from '../types';

interface BoardViewProps {
  boardId: string;
}

export const BoardView: React.FC<BoardViewProps> = ({ boardId }) => {
  const [board, setBoard] = useState<BoardType | null>(null);
  const [loading, setLoading] = useState(true);
  const { 
    setBoardContext, 
    canCreateCard, 
    canManageBoardMembers,
    isBoardAdmin
  } = usePermission();

  useEffect(() => {
    const loadBoard = async () => {
      try {
        // Fetch board
        const response = await fetch(`/api/boards/${boardId}`, {
          credentials: 'include',
        });
        const data = await response.json();
        setBoard(data);

        // Get user's role and set context
        // In real app, fetch user's board member record
        const userRole = 'ADMIN'; // From API
        setBoardContext(boardId, userRole as BoardRole);
      } catch (error) {
        console.error('Failed to load board:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBoard();
  }, [boardId, setBoardContext]);

  if (loading) return <div>Loading...</div>;
  if (!board) return <div>Board not found</div>;

  return (
    <div className="space-y-4">
      {/* Board Header */}
      <div className="flex justify-between items-center">
        <h1>{board.name}</h1>
        {isBoardAdmin && (
          <button className="btn-settings">Settings</button>
        )}
      </div>

      {/* Create Card Button */}
      {canCreateCard && (
        <button className="btn-primary">+ Create Card</button>
      )}

      {/* Member Management */}
      {canManageBoardMembers && (
        <MemberManagement
          type="board"
          entityId={boardId}
          currentUserRole="ADMIN"
        />
      )}

      {/* Board Lists */}
      <div className="flex gap-4">
        {board.lists.map(list => (
          <div key={list.id}>
            <h2>{list.name}</h2>
            {/* Cards in list */}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Common Patterns

### Disable Actions Based on Role

```typescript
<button 
  disabled={!canEditCard}
  title={!canEditCard ? 'Insufficient permissions' : ''}
>
  Edit
</button>
```

### Show Role Badge

```typescript
<span className={`badge badge-${boardRole}`}>
  {boardRole}
</span>
```

### Check Multiple Permissions

```typescript
const canManage = canEditCard && canDeleteCard && canManageBoardMembers;

if (canManage) {
  // Show full management UI
}
```

### Fallback UI for Limited Permissions

```typescript
{canCreateCard ? (
  <CreateCardForm />
) : (
  <div className="p-4 bg-blue-50 rounded">
    <p>Contact a board admin to create cards</p>
  </div>
)}
```

## Testing Permission Context

```typescript
import { render, screen } from '@testing-library/react';
import { PermissionProvider } from '../context/PermissionContext';
import { MyComponent } from './MyComponent';

test('shows create button when can create', () => {
  render(
    <PermissionProvider>
      <MyComponent />
    </PermissionProvider>
  );

  expect(screen.getByText('Create Card')).toBeInTheDocument();
});
```

## Migration Checklist

- [ ] Understand permission context API
- [ ] Import and use permission hooks in components
- [ ] Update Board component to set context
- [ ] Add conditional rendering based on permissions
- [ ] Integrate MemberManagement component
- [ ] Integrate BoardSettings component
- [ ] Test with different user roles
- [ ] Verify API calls include proper error handling
- [ ] Test permission denials gracefully
- [ ] Update existing permission checks to use context

## Useful Hooks Summary

| Hook | Purpose |
|------|---------|
| `usePermission()` | Get all permissions and setters |
| `useCanDo(action)` | Check single permission |
| `useAuth()` | Get current user info |

## Performance Tips

1. **Memoize permission checks**:
```typescript
const canEdit = useMemo(() => canEditCard && cardOwner === userId, [canEditCard, cardOwner, userId]);
```

2. **Update context only when needed**:
```typescript
useEffect(() => {
  // Only update if role actually changed
  if (newRole !== boardRole) {
    setBoardContext(boardId, newRole);
  }
}, [newRole, boardRole, boardId, setBoardContext]);
```

3. **Use selectors for specific permissions**:
```typescript
const canEdit = useCanDo('canEditCard');
// instead of
const { canEditCard } = usePermission();
```

## Troubleshooting

### Permission Context not available
- Ensure PermissionProvider wraps component in App.tsx
- Check for multiple React instances

### Permissions always null
- Call `setBoardContext()` after fetching user role
- Verify API returns correct role

### Components not updating
- Check usePermission dependencies
- Verify setBoardContext is called with correct parameters

---

**Last Updated**: May 18, 2026
**Ready for Integration**: ✅
