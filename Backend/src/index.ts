import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno PRIMERO, antes de cualquier otro import
dotenv.config({ path: path.join(__dirname, '../.env') }); // Cargar desde raíz

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from './passport';
import { verifyJWT, errorHandler, requestLogger } from './middleware';
import workspaceRoutes from './routes/workspace.routes';
import boardRoutes from './routes/board.routes';
import listRoutes from './routes/list.routes';
import cardRoutes from './routes/card.routes';
import userRoutes from './routes/user.routes';
import tagRoutes from './routes/tag.routes';
import commentRoutes from './routes/comment.routes';
import activityRoutes from './routes/activity.routes';
import memberRoutes from './routes/member.routes';
import invitationRoutes from './routes/invitation.routes';
import authRoutes from './routes/auth.routes';
import oauthRoutes from './routes/oauth.routes';
import { prisma } from './prisma';
import logger from './logger';
import { logAudit } from './authorization';

const app = express();

// Security middleware - Helmet adds various HTTP headers
app.use(helmet());

// Configurar CORS para permitir credenciales (cookies)
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // Permite enviar cookies
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middlewares globales
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Session middleware para Passport (necesario para OAuth)
app.use(session({
  secret: process.env.JWT_SECRET || 'ps-project-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(requestLogger);

// Rutas públicas (sin protección JWT)
app.use('/auth', authRoutes);
app.use('/auth', oauthRoutes);

// Rutas de invitaciones públicas (sin JWT requerido)
app.post('/invitations/:token/accept', async (req: any, res) => {
  try {
    // Helper para obtener parámetros de URL
    const getParam = (param: string | string[] | undefined): string => {
      if (!param) throw new Error('Parameter is required');
      if (Array.isArray(param)) return param[0];
      return param;
    };

    const token = getParam(req.params.token);
    const { userId } = req.body as any;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Find invitation (could be workspace or board)
    let invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: true,
      },
    });

    let boardInvitation = null;
    if (!invitation) {
      boardInvitation = await prisma.boardInvitation.findUnique({
        where: { token },
        include: {
          board: {
            include: {
              workspace: true,
            },
          },
        },
      });
    }

    if (!invitation && !boardInvitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (invitation) {
      // Check if expired
      if (new Date() > invitation.expiresAt) {
        return res.status(410).json({ error: 'Invitation has expired' });
      }

      // Check if already accepted
      if (invitation.status !== 'PENDING') {
        return res.status(400).json({ error: `Invitation already ${invitation.status.toLowerCase()}` });
      }

      // Check if user email matches invitation email
      if (user.email !== invitation.email) {
        return res.status(403).json({ error: 'User email does not match invitation' });
      }

      // Check if already a member
      const existingMember = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: invitation.workspaceId,
          },
        },
      });

      if (existingMember) {
        return res.status(400).json({ error: 'User is already a workspace member' });
      }

      // Add user to workspace
      const member = await prisma.workspaceMember.create({
        data: {
          userId,
          workspaceId: invitation.workspaceId,
          role: invitation.role,
        },
        include: {
          user: true,
        },
      });

      // Mark invitation as accepted
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      // Log audit
      await logAudit(
        userId,
        'ACCEPT_WORKSPACE_INVITATION',
        'WorkspaceInvitation',
        invitation.id,
        {
          workspaceId: invitation.workspaceId,
          role: invitation.role,
        },
        req
      );

      logger.info(`Workspace invitation accepted by ${userId} for workspace ${invitation.workspaceId}`, {
        userId,
      });

      return res.json({
        success: true,
        message: 'Invitation accepted',
        data: {
          ...member,
          workspace: invitation.workspace,
          workspaceId: invitation.workspaceId,
        },
      });
    } else {
      // Board invitation
      // Check if expired
      if (new Date() > boardInvitation!.expiresAt) {
        return res.status(410).json({ error: 'Invitation has expired' });
      }

      // Check if already accepted
      if (boardInvitation!.status !== 'PENDING') {
        return res.status(400).json({ error: `Invitation already ${boardInvitation!.status.toLowerCase()}` });
      }

      // Check if user email matches invitation email
      if (user.email !== boardInvitation!.email) {
        return res.status(403).json({ error: 'User email does not match invitation' });
      }

      // Check if already a member of the board
      const existingMember = await prisma.boardMember.findUnique({
        where: {
          userId_boardId: {
            userId,
            boardId: boardInvitation!.boardId,
          },
        },
      });

      if (existingMember) {
        return res.status(400).json({ error: 'User is already a board member' });
      }

      // Check if user is member of workspace, if not, add them automatically as MEMBER
      const workspaceMembership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: boardInvitation!.board.workspaceId,
          },
        },
      });

      if (!workspaceMembership) {
        await prisma.workspaceMember.create({
          data: {
            userId,
            workspaceId: boardInvitation!.board.workspaceId,
            role: 'MEMBER',
          },
        });
        logger.info(`User ${userId} auto-added to workspace ${boardInvitation!.board.workspaceId} (accepting board invitation)`);
      }

      // Add user to board
      const member = await prisma.boardMember.create({
        data: {
          userId,
          boardId: boardInvitation!.boardId,
          role: boardInvitation!.role,
        },
        include: {
          user: true,
        },
      });

      // Mark invitation as accepted
      await prisma.boardInvitation.update({
        where: { id: boardInvitation!.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      // Log audit
      await logAudit(
        userId,
        'ACCEPT_BOARD_INVITATION',
        'BoardInvitation',
        boardInvitation!.id,
        {
          boardId: boardInvitation!.boardId,
          role: boardInvitation!.role,
        },
        req
      );

      logger.info(`Board invitation accepted by ${userId} for board ${boardInvitation!.boardId}`, {
        userId,
      });

      return res.json({
        success: true,
        message: 'Invitation accepted',
        data: {
          ...member,
          board: boardInvitation!.board,
          workspaceId: boardInvitation!.board.workspaceId,
        },
      });
    }
  } catch (error) {
    logger.error('Error accepting invitation', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware de protección JWT para todas las rutas posteriores
app.use(verifyJWT);

// Rutas API protegidas
app.use('/workspaces', workspaceRoutes);
app.use('/boards', boardRoutes);
app.use('/lists', listRoutes);
app.use('/cards', cardRoutes);
app.use('/users', userRoutes);
app.use('/tags', tagRoutes);
app.use('/comments', commentRoutes);
app.use('/activities', activityRoutes);
app.use('/', memberRoutes);
app.use('/', invitationRoutes);

// Ruta base (pública)
app.get('/', (req: any, res) => {
  res.json({ message: 'Ahoy! Pirate Ship API is running 🏴‍☠️' });
});

// Middleware de manejo de errores (debe ser el último)
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
