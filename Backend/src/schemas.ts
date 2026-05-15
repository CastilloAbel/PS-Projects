import { z } from 'zod';

/**
 * Esquemas de validación para la API
 * Usando Zod para validación de tipos en runtime
 */

// =============== AUTH SCHEMAS ===============

export const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(1, 'Contraseña requerida')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
});

// =============== WORKSPACE SCHEMAS ===============

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  description: z.string().max(500).optional()
});

// =============== BOARD SCHEMAS ===============

export const createBoardSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  workspaceId: z.string().uuid('ID de workspace inválido'),
  background: z.string().optional()
});

export const updateBoardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  background: z.string().optional()
});

// =============== LIST SCHEMAS ===============

export const createListSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  boardId: z.string().uuid('ID de board inválido'),
  order: z.number().int().min(0),
  userId: z.string().optional()
});

// =============== CARD SCHEMAS ===============

export const createCardSchema = z.object({
  title: z.string().min(1, 'Título requerido').max(200),
  listId: z.string().uuid('ID de lista inválido'),
  order: z.number().int().min(0),
  description: z.string().max(5000).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  userId: z.string().optional()
});

export const updateCardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  isCompleted: z.boolean().optional(),
  userId: z.string().optional()
});

export const moveCardSchema = z.object({
  listId: z.string().uuid('ID de lista inválido'),
  order: z.number().int().min(0),
  userId: z.string().optional()
});

export const addCardTagSchema = z.object({
  tagId: z.string().uuid('ID de tag inválido'),
  userId: z.string().optional()
});

// =============== TAG SCHEMAS ===============

export const createTagSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color HEX inválido'),
  workspaceId: z.string().uuid('ID de workspace inválido')
});

export const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color HEX inválido').optional()
});

// =============== COMMENT SCHEMAS ===============

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Contenido requerido').max(5000),
  cardId: z.string().uuid('ID de card inválido'),
  userId: z.string().optional()
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  userId: z.string().optional()
});

// =============== USER SCHEMAS ===============

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  department: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional()
});

export const userSearchSchema = z.object({
  q: z.string().min(2, 'Búsqueda debe tener al menos 2 caracteres').max(100),
  skip: z.number().int().min(0).optional(),
  take: z.number().int().min(1).max(50).optional()
});

// Export types from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
export type CreateListInput = z.infer<typeof createListSchema>;
export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type MoveCardInput = z.infer<typeof moveCardSchema>;
export type AddCardTagInput = z.infer<typeof addCardTagSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserSearchInput = z.infer<typeof userSearchSchema>;
