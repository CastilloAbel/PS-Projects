import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireWorkspacePermission } from '../middleware/authorization';
import { prisma } from '../db';
import { logger } from '../utils/logger';
import { generateInvitationToken, getInvitationExpiryDate, generateInvitationLink } from '../utils/invitationUtils';
import { sendWorkspaceInvitationEmail, sendBoardInvitationEmail } from '../services/emailService';
import { logAudit } from '../utils/auditLogger';
import { getParam } from '../utils/helpers';

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
  requireAuth,
  requireWorkspacePermission('MANAGE_MEMBERS'),
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

      if (existingUser) {
        const existingMember = await prisma.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId: existingUser.id,
              workspaceId,
            },
          },
        });

        if (existingMember) {
          return res.status(400).json({ error: 'User is already a workspace member' });
        }
      }

      // Check if invitation already exists
      const existingInvitation = await prisma.workspaceInvitation.findFirst({
        where: {
          email,
          workspaceId,
          status: 'PENDING',
        },
      });

      if (existingInvitation) {
        return res.status(400).json({ error: 'Pending invitation already exists for this email' });
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
  requireAuth,
  requireWorkspacePermission('MANAGE_MEMBERS'),
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
  requireAuth,
  requireWorkspacePermission('MANAGE_MEMBERS'),
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

export default router;
