import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { verifyJWT, errorHandler, requestLogger } from './middleware';
import workspaceRoutes from './routes/workspace.routes';
import boardRoutes from './routes/board.routes';
import listRoutes from './routes/list.routes';
import cardRoutes from './routes/card.routes';
import userRoutes from './routes/user.routes';
import tagRoutes from './routes/tag.routes';
import commentRoutes from './routes/comment.routes';
import activityRoutes from './routes/activity.routes';
import authRoutes from './routes/auth.routes';

// Cargar variables de entorno
dotenv.config({ path: '../.env' }); // Apunta al archivo .env en la raíz del monorepo

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
app.use(requestLogger);

// Rutas públicas (sin protección JWT)
app.use('/auth', authRoutes);

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
