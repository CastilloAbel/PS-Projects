import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../logger';
import {
  isWorkspaceAdmin,
  isBoardOwner,
  canUserDoInBoard,
  logAudit,
} from '../authorization';
import { requireBoardPermission, requireWorkspaceAdmin, requireBoardOwner } from '../authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Helper to safely extract params
const getParam = (param: string | string[] | undefined): string => {
  if (typeof param === 'string') return param;
  if (Array.isArray(param)) return param[0];
  return '';
};

// ============ BOARD MEMBER ENDPOINTS ============

/**
 * POST /boards/:id/members - Add member to board with role
 */
router.post(
  '/boards/:boardId/members',
  requireBoardPermission('MANAGE_MEMBERS'),
  async (req: Request, res: Response) => {
    try {
      const boardId = getParam(req.params.boardId);
      const { userId, role } = req.body as any;
      const requesterId = req.userId as string;

      // Validate inputs
      if (!userId || !role) {
        return res.status(400).json({ error: 'userId and role are required' });
      }

      const validRoles = ['OWNER', 'ADMIN', 'EDITOR', 'COMMENTER', 'VIEWER'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      // Verify board exists
      const board = await prisma.board.findUnique({
        where: { id: boardId },
      });

      if (!board) {
        logger.warn(`Board not found: ${boardId}`, { userId: requesterId });
        return res.status(404).json({ error: 'Board not found' });
      }

      // Check if user to add exists
      const userToAdd = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userToAdd) {
        logger.warn(`User not found: ${userId}`, { userId: requesterId });
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if already a member
      const existing = await prisma.boardMember.findUnique({
        where: {
          userId_boardId: {
            userId,
            boardId,
          },
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'User is already a board member' });
      }

      // Check if user is member of workspace, if not, add them automatically
      const workspaceMembership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: board.workspaceId,
          },
        },
      });

      if (!workspaceMembership) {
        // Auto-add to workspace as MEMBER role
        await prisma.workspaceMember.create({
          data: {
            userId,
            workspaceId: board.workspaceId,
            role: 'MEMBER',
          },
        });
        logger.info(`User ${userId} auto-added to workspace ${board.workspaceId} (added to board)`, {
          userId: requesterId,
        });
      }

      // Create board member
      const boardMember = await prisma.boardMember.create({
        data: {
          userId,
          boardId,
          role: role as any,
        },
        include: {
          user: true,
        },
      });

      // Log audit
      await logAudit(
        requesterId,
        'ADD_BOARD_MEMBER',
        'BoardMember',
        boardMember.id,
        {
          userId,
          boardId,
          role,
        },
        req
      );

      logger.info(`User ${userId} added to board ${boardId} with role ${role}`, {
        userId: requesterId,
      });

      res.status(201).json({
        success: true,
        data: boardMember,
      });
    } catch (error) {
      logger.error('Error adding board member', { error, userId: req.userId });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /boards/:id/members - List board members
 */
router.get(
  '/boards/:boardId/members',
  requireBoardPermission('VIEW'),
  async (req: Request, res: Response) => {
    try {
      const boardId = getParam(req.params.boardId);
      const requesterId = req.userId as string;

      // Verify board exists
      const board = await prisma.board.findUnique({
        where: { id: boardId },
      });

      if (!board) {
        logger.warn(`Board not found: ${boardId}`, { userId: requesterId });
        return res.status(404).json({ error: 'Board not found' });
      }

      // Get board members
      const members = await prisma.boardMember.findMany({
        where: { boardId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      });

      // Also include board owner (who may not have a BoardMember record)
      const boardOwner = await prisma.user.findUnique({
        where: { id: board.ownerId },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      });

      // Check if owner is already in members list
      const ownerInList = members.find((m) => m.userId === board.ownerId);

      if (!ownerInList && boardOwner) {
        members.unshift({
          id: `${board.ownerId}-owner`,
          role: 'OWNER' as any,
          joinedAt: board.createdAt,
          userId: board.ownerId,
          boardId,
          user: boardOwner,
        } as any);
      }

      logger.info(`Listed ${members.length} members for board ${boardId}`, {
        userId: requesterId,
      });

      res.json({
        success: true,
        data: members,
      });
    } catch (error) {
      logger.error('Error listing board members', { error, userId: req.userId });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PATCH /boards/:id/members/:userId - Update member role
 */
router.patch(
  '/boards/:boardId/members/:userId',
  requireBoardPermission('MANAGE_MEMBERS'),
  async (req: Request, res: Response) => {
    try {
      const boardId = getParam(req.params.boardId);
      const userId = getParam(req.params.userId);
      const { role } = req.body as any;
      const requesterId = req.userId as string;

      if (!role) {
        return res.status(400).json({ error: 'role is required' });
      }

      const validRoles = ['OWNER', 'ADMIN', 'EDITOR', 'COMMENTER', 'VIEWER'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      // Cannot change board owner role
      const board = await prisma.board.findUnique({
        where: { id: boardId },
      });

      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }

      if (userId === board.ownerId && role !== 'OWNER') {
        return res.status(400).json({ error: 'Cannot change board owner role' });
      }

      // Update member
      const boardMember = await prisma.boardMember.update({
        where: {
          userId_boardId: {
            userId,
            boardId,
          },
        },
        data: {
          role: role as any,
        },
        include: {
          user: true,
        },
      });

      // Log audit
      await logAudit(
        requesterId,
        'UPDATE_BOARD_MEMBER',
        'BoardMember',
        boardMember.id,
        {
          userId,
          boardId,
          newRole: role,
        },
        req
      );

      logger.info(`Updated role for user ${userId} in board ${boardId} to ${role}`, {
        userId: requesterId,
      });

      res.json({
        success: true,
        data: boardMember,
      });
    } catch (error) {
      logger.error('Error updating board member', { error, userId: req.userId });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /boards/:id/members/:userId - Remove member from board
 */
router.delete(
  '/boards/:boardId/members/:userId',
  requireBoardPermission('MANAGE_MEMBERS'),
  async (req: Request, res: Response) => {
    try {
      const boardId = getParam(req.params.boardId);
      const userId = getParam(req.params.userId);
      const requesterId = req.userId as string;

      // Verify board exists
      const board = await prisma.board.findUnique({
        where: { id: boardId },
      });

      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }

      // Cannot remove board owner
      if (userId === board.ownerId) {
        return res.status(400).json({ error: 'Cannot remove board owner' });
      }

      // Delete member
      await prisma.boardMember.delete({
        where: {
          userId_boardId: {
            userId,
            boardId,
          },
        },
      });

      // Log audit
      await logAudit(
        requesterId,
        'REMOVE_BOARD_MEMBER',
        'BoardMember',
        userId,
        {
          userId,
          boardId,
        },
        req
      );

      logger.info(`Removed user ${userId} from board ${boardId}`, {
        userId: requesterId,
      });

      res.json({ success: true, message: 'Member removed from board' });
    } catch (error) {
      logger.error('Error removing board member', { error, userId: req.userId });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ============ WORKSPACE MEMBER ENDPOINTS ============

/**
 * POST /workspaces/:id/members - Add member to workspace
 */
router.post(
  '/workspaces/:workspaceId/members',
  requireWorkspaceAdmin as any,
  async (req: Request, res: Response) => {
    try {
      const workspaceId = getParam(req.params.workspaceId);
      const { userId, role } = req.body as any;
      const requesterId = req.userId as string;

      if (!userId || !role) {
        return res.status(400).json({ error: 'userId and role are required' });
      }

      const validRoles = ['OWNER', 'ADMIN', 'MEMBER'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      // Verify workspace exists
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      // Check if user exists
      const userToAdd = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userToAdd) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if already a member
      const existing = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId,
          },
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'User is already a workspace member' });
      }

      // Create workspace member
      const workspaceMember = await prisma.workspaceMember.create({
        data: {
          userId,
          workspaceId,
          role: role as any,
        },
        include: {
          user: true,
        },
      });

      // Log audit
      await logAudit(
        requesterId,
        'ADD_WORKSPACE_MEMBER',
        'WorkspaceMember',
        workspaceMember.id,
        {
          userId,
          workspaceId,
          role,
        },
        req
      );

      logger.info(`User ${userId} added to workspace ${workspaceId} with role ${role}`, {
        userId: requesterId,
      });

      res.status(201).json({
        success: true,
        data: workspaceMember,
      });
    } catch (error) {
      logger.error('Error adding workspace member', { error, userId: req.userId });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /workspaces/:id/members - List workspace members
 */
router.get(
  '/workspaces/:workspaceId/members',
  async (req: Request, res: Response) => {
    try {
      const workspaceId = getParam(req.params.workspaceId);
      const requesterId = req.userId as string;

      // Verify workspace exists and user is member
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      // Check if requester is workspace member
      const isMember = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: requesterId,
            workspaceId,
          },
        },
      });

      if (!isMember) {
        logger.warn(`User ${requesterId} not workspace member`, {
          workspaceId,
        });
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get workspace members
      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      });

      logger.info(`Listed ${members.length} members for workspace ${workspaceId}`, {
        userId: requesterId,
      });

      res.json({
        success: true,
        data: members,
      });
    } catch (error) {
      logger.error('Error listing workspace members', { error, userId: req.userId });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PATCH /workspaces/:id/members/:userId - Update member role
 */
router.patch(
  '/workspaces/:workspaceId/members/:userId',
  requireWorkspaceAdmin as any,
  async (req: Request, res: Response) => {
    try {
      const workspaceId = getParam(req.params.workspaceId);
      const userId = getParam(req.params.userId);
      const { role } = req.body as any;
      const requesterId = req.userId as string;

      if (!role) {
        return res.status(400).json({ error: 'role is required' });
      }

      const validRoles = ['OWNER', 'ADMIN', 'MEMBER'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      // Cannot change workspace owner role
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          members: true,
        },
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      // Find owner
      const owner = workspace.members.find((m: any) => m.role === 'OWNER');
      if (userId === owner?.userId && role !== 'OWNER') {
        return res.status(400).json({ error: 'Cannot change workspace owner role' });
      }

      // Update member
      const workspaceMember = await prisma.workspaceMember.update({
        where: {
          userId_workspaceId: {
            userId: getParam(userId),
            workspaceId: getParam(workspaceId),
          },
        },
        data: {
          role: role as any,
        },
        include: {
          user: true,
        },
      });

      // Log audit
      await logAudit(
        requesterId,
        'UPDATE_WORKSPACE_MEMBER',
        'WorkspaceMember',
        workspaceMember.id,
        {
          userId,
          workspaceId,
          newRole: role,
        },
        req
      );

      logger.info(`Updated role for user ${userId} in workspace ${workspaceId} to ${role}`, {
        userId: requesterId,
      });

      res.json({
        success: true,
        data: workspaceMember,
      });
    } catch (error) {
      logger.error('Error updating workspace member', { error, userId: req.userId });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /workspaces/:id/members/:userId - Remove member from workspace
 */
router.delete(
  '/workspaces/:workspaceId/members/:userId',
  requireWorkspaceAdmin as any,
  async (req: Request, res: Response) => {
    try {
      const workspaceId = getParam(req.params.workspaceId);
      const userId = getParam(req.params.userId);
      const requesterId = req.userId as string;

      // Verify workspace exists
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          members: true,
        },
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      // Check if workspace owner - cannot remove owner
      const owner = workspace.members.find((m: any) => m.role === 'OWNER');
      if (userId === owner?.userId) {
        return res.status(400).json({ error: 'Cannot remove workspace owner' });
      }

      // Delete member
      await prisma.workspaceMember.delete({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId,
          },
        },
      });

      // Log audit
      await logAudit(
        requesterId,
        'REMOVE_WORKSPACE_MEMBER',
        'WorkspaceMember',
        userId,
        {
          userId,
          workspaceId,
        },
        req
      );

      logger.info(`Removed user ${userId} from workspace ${workspaceId}`, {
        userId: requesterId,
      });

      res.json({ success: true, message: 'Member removed from workspace' });
    } catch (error) {
      logger.error('Error removing workspace member', { error, userId: req.userId });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
