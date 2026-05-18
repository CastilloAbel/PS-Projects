import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup: Create test database or ensure it exists
  await prisma.$connect();
});

afterAll(async () => {
  // Cleanup: Close database connection
  await prisma.$disconnect();
});

// Mock the logger to avoid spam during tests
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));
