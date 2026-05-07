import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import workspaceRoutes from './routes/workspace.routes';
import boardRoutes from './routes/board.routes';
import listRoutes from './routes/list.routes';
import cardRoutes from './routes/card.routes';
import userRoutes from './routes/user.routes';

// Cargar variables de entorno
dotenv.config({ path: '../.env' }); // Apunta al archivo .env en la raíz del monorepo

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas API
app.use('/workspaces', workspaceRoutes);
app.use('/boards', boardRoutes);
app.use('/lists', listRoutes);
app.use('/cards', cardRoutes);
app.use('/users', userRoutes);

// Ruta base
app.get('/', (req, res) => {
  res.json({ message: 'Ahoy! Pirate Ship API is running 🏴‍☠️' });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
