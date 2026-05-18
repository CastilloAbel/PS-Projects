import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a mock JWT token for testing
 */
export function createTestToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
}

/**
 * Create a test user with default values
 */
export async function createTestUser(overrides: any = {}) {
  return prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      password: 'hashed_password',
      name: 'Test User',
      ...overrides,
    },
  });
}

/**
 * Create a test workspace
 */
export async function createTestWorkspace(userId: string, overrides: any = {}) {
  const workspace = await prisma.workspace.create({
    data: {
      name: `Test Workspace ${Date.now()}`,
      description: 'Test workspace for testing',
      ...overrides,
    },
  });

  // Add creator as OWNER
  await prisma.workspaceMember.create({
    data: {
      userId,
      workspaceId: workspace.id,
      role: 'OWNER',
    },
  });

  return workspace;
}

/**
 * Create a test board
 */
export async function createTestBoard(ownerId: string, workspaceId: string, overrides: any = {}) {
  return prisma.board.create({
    data: {
      name: `Test Board ${Date.now()}`,
      workspaceId,
      ownerId,
      ...overrides,
    },
  });
}

/**
 * Create a board member with a specific role
 */
export async function createBoardMember(userId: string, boardId: string, role: string = 'VIEWER') {
  return prisma.boardMember.create({
    data: {
      userId,
      boardId,
      role: role as any,
    },
  });
}

/**
 * Create a test list
 */
export async function createTestList(boardId: string, order: number = 0, overrides: any = {}) {
  return prisma.list.create({
    data: {
      name: `Test List ${Date.now()}`,
      boardId,
      order,
      ...overrides,
    },
  });
}

/**
 * Create a test card
 */
export async function createTestCard(
  listId: string,
  order: number = 0,
  assigneeId?: string,
  overrides: any = {}
) {
  return prisma.card.create({
    data: {
      title: `Test Card ${Date.now()}`,
      listId,
      order,
      assigneeId,
      ...overrides,
    },
  });
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
  // Delete in order of foreign key dependencies
  await prisma.auditLog.deleteMany({});
  await prisma.boardMember.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.cardTag.deleteMany({});
  await prisma.card.deleteMany({});
  await prisma.list.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.board.deleteMany({});
  await prisma.workspaceMember.deleteMany({});
  await prisma.workspace.deleteMany({});
  await prisma.user.deleteMany({});
}

/**
 * Create mock request with user context
 */
export function createMockRequest(overrides: any = {}): Partial<Request> {
  return {
    userId: overrides.userId || 'test-user-id',
    userEmail: overrides.userEmail || 'test@example.com',
    ip: overrides.ip || '::1',
    headers: {
      'user-agent': 'Test Agent',
    },
    ...overrides,
  };
}

/**
 * Create mock response
 */
export function createMockResponse(): Partial<Response> {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
}

/**
 * Create mock next function
 */
export function createMockNext(): NextFunction {
  return jest.fn();
}
