import { Router, Request, Response } from 'express';
import { verifyJWT } from '../middleware';
import { isWorkspaceOwner, isWorkspaceAdmin, canUserDoInBoard, logAudit } from '../authorization';
import { prisma } from '../prisma';
import logger from '../logger';
import { generateInvitationToken, getInvitationExpiryDate, generateInvitationLink } from '../utils/invitationUtils';
import { sendWorkspaceInvitationEmail, sendBoardInvitationEmail } from '../services/emailService';

const getParam = (param: string | string[] | undefined): string => {
  if (!param) throw new Error('Parameter is required');
  if (Array.isArray(param)) return param[0];
  return param;
};

const router = Router();

// ============================================================================
// WORKSPACE INVITATIONS
// ============================================================================

/**
 * POST /workspaces/:id/invitations - Send workspace invitation
 * Requires: MANAGE_MEMBERS permission
 */
router.post(
  '/workspaces/:workspaceId/invitations',
  verifyJWT,
  async (req: Request, res: Response) => {
    try {
      const workspaceId = getParam(req.params.workspaceId);
      const { email, role = 'MEMBER' } = req.body as any;
      const requesterId = req.userId as string;

      // Validate inputs
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email is required' });
      }

      const validRoles = ['OWNER', 'ADMIN', 'MEMBER'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid workspace role' });
      }

      // Verify workspace exists
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) {
        logger.warn(`Workspace not found: ${workspaceId}`, { userId: requesterId });
        return res.status(404).json({ error: 'Workspace not found' });
      }

      // Check if email is already a member
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      // Check if invitation already exists
      const existingInvitation = await prisma.workspaceInvitation.findFirst({
        where: {
          email,
          workspaceId,
          status: 'PENDING',
        },
      });

      if (existingInvitation) {
        // Delete the existing pending invitation so we can create a new one with a fresh token
        await prisma.workspaceInvitation.delete({
          where: { id: existingInvitation.id }
        });
      }

      // Generate invitation token and create invitation
      const token = generateInvitationToken();
      const expiresAt = getInvitationExpiryDate(7);

      const invitation = await prisma.workspaceInvitation.create({
        data: {
          email,
          role: role as any,
          token,
          expiresAt,
          workspaceId,
          invitedBy: requesterId,
        },
        include: {
          workspace: true,
          invitedByUser: true,
        },
      });

      // Get requester info for email
      const requester = await prisma.user.findUnique({
        where: { id: requesterId },
      });

      // Send invitation email
      const invitationLink = generateInvitationLink(token);
      await sendWorkspaceInvitationEmail(
        email,
        workspace.name,
        requester?.name || 'Someone',
        invitationLink
      );

      // Log audit
      await logAudit(
        requesterId,
        'SEND_WORKSPACE_INVITATION',
        'WorkspaceInvitation',
        invitation.id,
        {
          email,
          workspaceId,
          role,
          expiresAt,
        },
        req
      );

      logger.info(`Workspace invitation sent to ${email} for workspace ${workspaceId}`, {
        userId: requesterId,
      });

      res.status(201).json({
        success: true,
        data: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
          status: invitation.status,
        },
      });
    } catch (error) {
      logger.error('Error sending workspace invitation', { error, userId: req.userId });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /workspaces/:id/invitations - List pending invitations
 * Requires: MANAGE_MEMBERS permission
 */
router.get(
  '/workspaces/:workspaceId/invitations',
  verifyJWT,
  async (req: Request, res: Response) => {
    try {
      const workspaceId = getParam(req.params.workspaceId);
      const requesterId = req.userId as string;

      // Verify workspace exists
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) {
        logger.warn(`Workspace not found: ${workspaceId}`, { userId: requesterId });
        return res.status(404).json({ error: 'Workspace not found' });
      }

      const invitations = await prisma.workspaceInvitation.findMany({
        where: { workspaceId },
        include: {
          invitedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: invitations,
      });
    } catch (error) {
      logger.error('Error listing workspace invitations', { error, userId: req.userId });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /workspaces/:id/invitations/:invitationId - Cancel invitation
 * Requires: MANAGE_MEMBERS permission
 */
router.delete(
  '/workspaces/:workspaceId/invitations/:invitationId',
  verifyJWT,
  async (req: Request, res: Response) => {
    try {
      const workspaceId = getParam(req.params.workspaceId);
      const invitationId = getParam(req.params.invitationId);
      const requesterId = req.userId as string;

      // Verify invitation exists and belongs to workspace
      const invitation = await prisma.workspaceInvitation.findUnique({
        where: { id: invitationId },
      });

      if (!invitation || invitation.workspaceId !== workspaceId) {
        return res.status(404).json({ error: 'Invitation not found' });
      }

      // Delete invitation
      await prisma.workspaceInvitation.delete({
        where: { id: invitationId },
      });

      // Log audit
      await logAudit(
        requesterId,
        'CANCEL_WORKSPACE_INVITATION',
        'WorkspaceInvitation',
        invitationId,
        {
          email: invitation.email,
          workspaceId,
        },
        req
      );

      logger.info(`Workspace invitation cancelled: ${invitationId}`, {
        userId: requesterId,
      });

      res.json({
        success: true,
        message: 'Invitation cancelled',
      });
    } catch (error) {
      logger.error('Error cancelling workspace invitation', { error, userId: req.userId });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /invitations/:token/accept - Accept invitation (PUBLIC)
 * Este endpoint está definido en index.ts como ruta pública
 */

// ============================================================================
// BOARD INVITATIONS
// ============================================================================

/**
 * POST /boards/:boardId/invitations - Send board invitation
 * Requires: MANAGE_MEMBERS permission on the board
 */
router.post(
  '/boards/:boardId/invitations',
  verifyJWT,
  async (req: Request, res: Response) => {
    try {
      const boardId = getParam(req.params.boardId);
      const { email, role = 'VIEWER' } = req.body as any;
      const requesterId = req.userId as string;

      // Validate inputs
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email is required' });
      }

      const validRoles = ['OWNER', 'ADMIN', 'EDITOR', 'COMMENTER', 'VIEWER'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid board role' });
      }

      // Verify board exists
      const board = await prisma.board.findUnique({
        where: { id: boardId },
        include: { workspace: true }
      });

      if (!board) {
        logger.warn(`Board not found: ${boardId}`, { userId: requesterId });
        return res.status(404).json({ error: 'Board not found' });
      }

      // Verify requester has permission to manage members in the board
      const hasPermission = await canUserDoInBoard(requesterId, boardId, 'MANAGE_MEMBERS');
      if (!hasPermission && board.ownerId !== requesterId) {
        logger.warn(`User ${requesterId} tried to invite to board ${boardId} without permission`);
        return res.status(403).json({ error: 'No tienes permiso para gestionar miembros en este tablero' });
      }

      // Check if email is already a member of the board
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      // Check if invitation already exists
      const existingInvitation = await prisma.boardInvitation.findFirst({
        where: {
          email,
          boardId,
          status: 'PENDING',
        },
      });

      if (existingInvitation) {
        // Delete the existing pending invitation so we can create a new one with a fresh token
        await prisma.boardInvitation.delete({
          where: { id: existingInvitation.id }
        });
      }

      // Generate invitation token and create invitation
      const token = generateInvitationToken();
      const expiresAt = getInvitationExpiryDate(7);

      const invitation = await prisma.boardInvitation.create({
        data: {
          email,
          role: role as any,
          token,
          expiresAt,
          boardId,
          invitedBy: requesterId,
        },
        include: {
          board: {
            include: {
              workspace: true
            }
          },
          invitedByUser: true,
        },
      });

      // Get requester info for email
      const requester = await prisma.user.findUnique({
        where: { id: requesterId },
      });

      // Send invitation email
      const invitationLink = generateInvitationLink(token);
      await sendBoardInvitationEmail(
        email,
        board.name,
        board.workspace.name,
        requester?.name || 'Someone',
        invitationLink
      );

      // Log audit
      await logAudit(
        requesterId,
        'SEND_BOARD_INVITATION',
        'BoardInvitation',
        invitation.id,
        {
          email,
          boardId,
          role,
          expiresAt,
        },
        req
      );

      logger.info(`Board invitation sent to ${email} for board ${boardId}`, {
        userId: requesterId,
      });

      res.status(201).json({
        success: true,
        data: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
          status: invitation.status,
        },
      });
    } catch (error) {
      logger.error('Error sending board invitation', { error, userId: req.userId });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /boards/:boardId/invitations - List pending invitations for board
 * Requires: VIEW permission on the board
 */
router.get(
  '/boards/:boardId/invitations',
  verifyJWT,
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

      // Verify requester has access to board
      const hasPermission = await canUserDoInBoard(requesterId, boardId, 'VIEW');
      if (!hasPermission && board.ownerId !== requesterId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const invitations = await prisma.boardInvitation.findMany({
        where: { boardId },
        include: {
          invitedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: invitations,
      });
    } catch (error) {
      logger.error('Error listing board invitations', { error, userId: req.userId });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /boards/:boardId/invitations/:invitationId - Cancel board invitation
 * Requires: MANAGE_MEMBERS permission on the board
 */
router.delete(
  '/boards/:boardId/invitations/:invitationId',
  verifyJWT,
  async (req: Request, res: Response) => {
    try {
      const boardId = getParam(req.params.boardId);
      const invitationId = getParam(req.params.invitationId);
      const requesterId = req.userId as string;

      // Verify board exists
      const board = await prisma.board.findUnique({
        where: { id: boardId },
      });

      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }

      // Verify requester has permission to manage members
      const hasPermission = await canUserDoInBoard(requesterId, boardId, 'MANAGE_MEMBERS');
      if (!hasPermission && board.ownerId !== requesterId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Verify invitation exists and belongs to board
      const invitation = await prisma.boardInvitation.findUnique({
        where: { id: invitationId },
      });

      if (!invitation || invitation.boardId !== boardId) {
        return res.status(404).json({ error: 'Invitation not found' });
      }

      // Delete invitation
      await prisma.boardInvitation.delete({
        where: { id: invitationId },
      });

      // Log audit
      await logAudit(
        requesterId,
        'CANCEL_BOARD_INVITATION',
        'BoardInvitation',
        invitationId,
        {
          email: invitation.email,
          boardId,
        },
        req
      );

      logger.info(`Board invitation cancelled: ${invitationId}`, {
        userId: requesterId,
      });

      res.json({
        success: true,
        message: 'Invitation cancelled',
      });
    } catch (error) {
      logger.error('Error cancelling board invitation', { error, userId: req.userId });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
