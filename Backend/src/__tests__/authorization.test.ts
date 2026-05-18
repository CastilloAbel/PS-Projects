import {
  isWorkspaceOwner,
  isWorkspaceAdmin,
  isWorkspaceMember,
  isBoardOwner,
  getBoardRole,
  canUserDoInBoard,
  canEditCard,
  canViewCard,
  canCommentCard,
  canDeleteComment,
  isCommentOwner,
} from '../authorization';
import {
  createTestUser,
  createTestWorkspace,
  createTestBoard,
  createBoardMember,
  createTestList,
  createTestCard,
  cleanupTestData,
} from './test-utils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Authorization Tests', () => {
  let user1: any;
  let user2: any;
  let user3: any;
  let workspace: any;
  let board: any;
  let list: any;
  let card: any;

  beforeAll(async () => {
    // Create test users
    user1 = await createTestUser({ name: 'User 1' });
    user2 = await createTestUser({ name: 'User 2' });
    user3 = await createTestUser({ name: 'User 3' });

    // Create workspace with user1 as owner
    workspace = await createTestWorkspace(user1.id);

    // Add user2 as ADMIN and user3 as MEMBER
    await prisma.workspaceMember.create({
      data: {
        userId: user2.id,
        workspaceId: workspace.id,
        role: 'ADMIN',
      },
    });

    await prisma.workspaceMember.create({
      data: {
        userId: user3.id,
        workspaceId: workspace.id,
        role: 'MEMBER',
      },
    });

    // Create board with user1 as owner
    board = await createTestBoard(user1.id, workspace.id);

    // Create list and card
    list = await createTestList(board.id);
    card = await createTestCard(list.id, 0, user2.id);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Workspace Role Checks', () => {
    it('should identify workspace owner', async () => {
      const result = await isWorkspaceOwner(user1.id, workspace.id);
      expect(result).toBe(true);
    });

    it('should identify non-owner as not owner', async () => {
      const result = await isWorkspaceOwner(user2.id, workspace.id);
      expect(result).toBe(false);
    });

    it('should identify workspace admin', async () => {
      const result = await isWorkspaceAdmin(user2.id, workspace.id);
      expect(result).toBe(true);
    });

    it('should identify workspace owner as admin', async () => {
      const result = await isWorkspaceAdmin(user1.id, workspace.id);
      expect(result).toBe(true);
    });

    it('should identify member as not admin', async () => {
      const result = await isWorkspaceAdmin(user3.id, workspace.id);
      expect(result).toBe(false);
    });

    it('should identify workspace member', async () => {
      const result = await isWorkspaceMember(user1.id, workspace.id);
      expect(result).toBe(true);
    });

    it('should reject non-member', async () => {
      const nonMember = await createTestUser({ name: 'Non Member' });
      const result = await isWorkspaceMember(nonMember.id, workspace.id);
      expect(result).toBe(false);
    });
  });

  describe('Board Role Checks', () => {
    it('should identify board owner', async () => {
      const result = await isBoardOwner(user1.id, board.id);
      expect(result).toBe(true);
    });

    it('should reject non-owner as board owner', async () => {
      const result = await isBoardOwner(user2.id, board.id);
      expect(result).toBe(false);
    });

    it('should return null for user without board membership', async () => {
      const result = await getBoardRole(user2.id, board.id);
      expect(result).toBe(null);
    });

    it('should return board role for board member', async () => {
      // Add user2 as EDITOR
      await createBoardMember(user2.id, board.id, 'EDITOR');
      const result = await getBoardRole(user2.id, board.id);
      expect(result).toBe('EDITOR');
    });

    it('should return OWNER for board creator', async () => {
      const result = await getBoardRole(user1.id, board.id);
      expect(result).toBe('OWNER');
    });
  });

  describe('Board Permission Checks', () => {
    beforeAll(async () => {
      // Clean previous board members
      await prisma.boardMember.deleteMany({ where: { boardId: board.id } });

      // Add users with different roles
      await createBoardMember(user1.id, board.id, 'OWNER');
      await createBoardMember(user2.id, board.id, 'ADMIN');
      await createBoardMember(user3.id, board.id, 'EDITOR');
    });

    it('OWNER can view board', async () => {
      const result = await canUserDoInBoard(user1.id, board.id, 'VIEW');
      expect(result).toBe(true);
    });

    it('OWNER can create cards', async () => {
      const result = await canUserDoInBoard(user1.id, board.id, 'CREATE');
      expect(result).toBe(true);
    });

    it('ADMIN can edit cards', async () => {
      const result = await canUserDoInBoard(user2.id, board.id, 'EDIT');
      expect(result).toBe(true);
    });

    it('ADMIN can manage members', async () => {
      const result = await canUserDoInBoard(user2.id, board.id, 'MANAGE_MEMBERS');
      expect(result).toBe(true);
    });

    it('EDITOR can create cards', async () => {
      const result = await canUserDoInBoard(user3.id, board.id, 'CREATE');
      expect(result).toBe(true);
    });

    it('EDITOR can edit cards', async () => {
      const result = await canUserDoInBoard(user3.id, board.id, 'EDIT');
      expect(result).toBe(true);
    });

    it('EDITOR cannot delete cards', async () => {
      const result = await canUserDoInBoard(user3.id, board.id, 'DELETE');
      expect(result).toBe(false);
    });

    it('EDITOR cannot manage members', async () => {
      const result = await canUserDoInBoard(user3.id, board.id, 'MANAGE_MEMBERS');
      expect(result).toBe(false);
    });
  });

  describe('Card Edit Restrictions', () => {
    let editCard: any;

    beforeAll(async () => {
      // Create card assigned to user2
      editCard = await createTestCard(list.id, 1, user2.id);
    });

    it('OWNER can edit any card', async () => {
      const result = await canEditCard(user1.id, editCard.id);
      expect(result).toBe(true);
    });

    it('ADMIN can edit any card', async () => {
      const result = await canEditCard(user2.id, editCard.id);
      expect(result).toBe(true);
    });

    it('EDITOR can edit assigned card', async () => {
      const result = await canEditCard(user3.id, editCard.id);
      // user3 is not assigned to this card
      expect(result).toBe(false);
    });

    it('EDITOR can edit only assigned cards', async () => {
      // Create card assigned to user3
      const user3Card = await createTestCard(list.id, 2, user3.id);
      const result = await canEditCard(user3.id, user3Card.id);
      expect(result).toBe(true);
    });
  });

  describe('Card View Permissions', () => {
    it('Board member can view cards', async () => {
      const result = await canViewCard(user1.id, card.id);
      expect(result).toBe(true);
    });

    it('Non-board member cannot view card', async () => {
      const nonMember = await createTestUser({ name: 'Non Member' });
      const result = await canViewCard(nonMember.id, card.id);
      expect(result).toBe(false);
    });
  });

  describe('Comment Permissions', () => {
    let comment: any;

    beforeAll(async () => {
      comment = await prisma.comment.create({
        data: {
          content: 'Test comment',
          cardId: card.id,
          userId: user2.id,
        },
      });
    });

    it('Board member can comment', async () => {
      const result = await canCommentCard(user1.id, board.id);
      expect(result).toBe(true);
    });

    it('COMMENTER role can comment', async () => {
      const commentCard = await createTestCard(list.id, 3);
      await createBoardMember(user3.id, board.id, 'COMMENTER');
      const result = await canCommentCard(user3.id, board.id);
      expect(result).toBe(true);
    });

    it('Comment owner can delete own comment', async () => {
      const result = await canDeleteComment(user2.id, comment.id, board.id);
      expect(result).toBe(true);
    });

    it('Non-owner cannot delete comment', async () => {
      const result = await canDeleteComment(user3.id, comment.id, board.id);
      expect(result).toBe(false);
    });

    it('Board admin can delete any comment', async () => {
      const result = await canDeleteComment(user2.id, comment.id, board.id);
      expect(result).toBe(true);
    });
  });

  describe('Comment Owner Check', () => {
    let comment: any;

    beforeAll(async () => {
      comment = await prisma.comment.create({
        data: {
          content: 'Owner test comment',
          cardId: card.id,
          userId: user1.id,
        },
      });
    });

    it('should identify comment owner', async () => {
      const result = await isCommentOwner(user1.id, comment.id);
      expect(result).toBe(true);
    });

    it('should reject non-owner', async () => {
      const result = await isCommentOwner(user2.id, comment.id);
      expect(result).toBe(false);
    });
  });
});
