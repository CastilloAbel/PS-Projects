import { prisma } from './prisma';
import { WorkspaceRole, BoardRole } from '@prisma/client';
import { Request } from 'express';

/**
 * TIPOS DE PERMISOS
 */
type PermissionAction = 
  | 'VIEW'
  | 'CREATE'
  | 'EDIT'
  | 'DELETE'
  | 'MANAGE_MEMBERS'
  | 'COMMENT';

/**
 * Verifica si un usuario es propietario de un workspace
 */
export async function isWorkspaceOwner(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId }
    }
  });

  return member?.role === WorkspaceRole.OWNER;
}

/**
 * Verifica si un usuario es admin o propietario de un workspace
 */
export async function isWorkspaceAdmin(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId }
    }
  });

  return member?.role === WorkspaceRole.OWNER || member?.role === WorkspaceRole.ADMIN;
}

/**
 * Verifica si un usuario es miembro de un workspace
 */
export async function isWorkspaceMember(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId }
    }
  });

  return !!member;
}

/**
 * Verifica si un usuario es propietario de un board
 */
export async function isBoardOwner(
  userId: string,
  boardId: string
): Promise<boolean> {
  const board = await prisma.board.findUnique({
    where: { id: boardId }
  });

  return board?.ownerId === userId;
}

/**
 * Obtiene el rol de un usuario en un board
 */
export async function getBoardRole(
  userId: string,
  boardId: string
): Promise<BoardRole | null> {
  // El propietario siempre es OWNER
  const board = await prisma.board.findUnique({
    where: { id: boardId }
  });

  if (board?.ownerId === userId) {
    return BoardRole.OWNER;
  }

  // Buscar en BoardMember
  const member = await prisma.boardMember.findUnique({
    where: {
      userId_boardId: { userId, boardId }
    }
  });

  return member?.role || null;
}

/**
 * Verifica si un usuario puede realizar una acción en un board
 */
export async function canUserDoInBoard(
  userId: string,
  boardId: string,
  action: PermissionAction
): Promise<boolean> {
  const role = await getBoardRole(userId, boardId);

  if (!role) {
    return false;
  }

  // Matriz de permisos por rol
  const permissions: Record<BoardRole, PermissionAction[]> = {
    OWNER: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE_MEMBERS', 'COMMENT'],
    ADMIN: ['VIEW', 'CREATE', 'EDIT', 'MANAGE_MEMBERS', 'COMMENT'],
    EDITOR: ['VIEW', 'CREATE', 'EDIT', 'COMMENT'],
    COMMENTER: ['VIEW', 'COMMENT'],
    VIEWER: ['VIEW']
  };

  return permissions[role]?.includes(action) || false;
}

/**
 * Verifica si un usuario puede editar una tarjeta específica
 * - El propietario del board puede editar cualquier tarjeta
 * - El admin del board puede editar cualquier tarjeta
 * - Los editores pueden editar tarjetas asignadas a ellos
 */
export async function canEditCard(
  userId: string,
  cardId: string
): Promise<boolean> {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      list: {
        include: {
          board: true
        }
      }
    }
  });

  if (!card) {
    return false;
  }

  const boardId = card.list.board.id;
  const role = await getBoardRole(userId, boardId);

  // Owner y Admin pueden editar cualquier tarjeta
  if (role === BoardRole.OWNER || role === BoardRole.ADMIN) {
    return true;
  }

  // Editor solo puede editar tarjetas asignadas a él
  if (role === BoardRole.EDITOR) {
    return card.assigneeId === userId;
  }

  return false;
}

/**
 * Verifica si un usuario puede crear una tarjeta en un board
 */
export async function canCreateCard(
  userId: string,
  boardId: string
): Promise<boolean> {
  return canUserDoInBoard(userId, boardId, 'CREATE');
}

/**
 * Verifica si un usuario puede ver un card
 */
export async function canViewCard(
  userId: string,
  cardId: string
): Promise<boolean> {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      list: {
        include: {
          board: true
        }
      }
    }
  });

  if (!card) {
    return false;
  }

  return canUserDoInBoard(userId, card.list.board.id, 'VIEW');
}

/**
 * Verifica si un usuario puede comentar en un card
 */
export async function canCommentCard(
  userId: string,
  cardId: string
): Promise<boolean> {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      list: {
        include: {
          board: true
        }
      }
    }
  });

  if (!card) {
    return false;
  }

  return canUserDoInBoard(userId, card.list.board.id, 'COMMENT');
}

/**
 * Verifica si un usuario es propietario de un comentario
 */
export async function isCommentOwner(
  userId: string,
  commentId: string
): Promise<boolean> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId }
  });

  return comment?.userId === userId;
}

/**
 * Verifica si un usuario puede eliminar un comentario
 */
export async function canDeleteComment(
  userId: string,
  commentId: string
): Promise<boolean> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      card: {
        include: {
          list: {
            include: {
              board: true
            }
          }
        }
      }
    }
  });

  if (!comment) {
    return false;
  }

  // Owner del comentario puede borrarlo
  if (comment.userId === userId) {
    return true;
  }

  // Admin o Owner del board puede borrarlo
  const role = await getBoardRole(userId, comment.card.list.board.id);
  return role === BoardRole.OWNER || role === BoardRole.ADMIN;
}

/**
 * Verifica si un usuario es propietario de un tag
 */
export async function isTagInWorkspace(
  userId: string,
  tagId: string
): Promise<boolean> {
  const tag = await prisma.tag.findUnique({
    where: { id: tagId }
  });

  if (!tag) {
    return false;
  }

  return isWorkspaceMember(userId, tag.workspaceId);
}

/**
 * Obtiene el rol de un usuario en un workspace
 */
export async function getWorkspaceRole(
  userId: string,
  workspaceId: string
): Promise<WorkspaceRole | null> {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId }
    }
  });

  return member?.role || null;
}

/**
 * Registra un cambio en el audit log
 */
export async function logAudit(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  changes: Record<string, any> = {},
  req?: Request
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        changes,
        ipAddress: req?.ip || undefined,
        userAgent: req?.get('user-agent') || undefined
      }
    });
  } catch (error) {
    // Log audit errors but don't break the request
    console.error('Error logging audit trail:', error);
  }
}
