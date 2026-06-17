import axios from 'axios';
import type { Workspace, Board, List, Card, User, Tag, Comment, Activity } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Include cookies in requests
});

// Note: JWT token is now stored in httpOnly cookies managed by the backend
// The browser automatically includes cookies in requests with withCredentials: true
// No need to manually add Authorization header

// =============== WORKSPACES ===============
export const fetchWorkspaces = async (): Promise<Workspace[]> => {
  const { data } = await api.get('/workspaces');
  return data;
};

export const getWorkspace = async (workspaceId: string): Promise<Workspace> => {
  const { data } = await api.get(`/workspaces/${workspaceId}`);
  return data;
};

export const createWorkspace = async (name: string, description?: string): Promise<Workspace> => {
  const { data } = await api.post('/workspaces', { name, description });
  return data;
};

// =============== BOARDS ===============
export const fetchBoards = async (): Promise<Board[]> => {
  const { data } = await api.get('/boards');
  return data;
};

export const getBoard = async (boardId: string): Promise<Board> => {
  const { data } = await api.get(`/boards/${boardId}`);
  return data;
};

export const createBoard = async (
  name: string,
  workspaceId: string,
  background?: string,
  type?: string,
  status?: string,
  startDate?: string | null,
  members?: string[]
): Promise<Board> => {
  const { data } = await api.post('/boards', {
    name,
    workspaceId,
    background,
    type,
    status,
    startDate,
    members,
  });
  return data;
};

export const updateBoard = async (boardId: string, updates: Partial<Board>): Promise<Board> => {
  const { data } = await api.patch(`/boards/${boardId}`, updates);
  return data;
};

// =============== LISTS ===============
export const createList = async (name: string, boardId: string, order: number, userId?: string): Promise<List> => {
  const { data } = await api.post('/lists', { name, boardId, order, userId });
  return data;
};

// =============== CARDS ===============
export const createCard = async (
  title: string,
  listId: string,
  order: number,
  priority?: string,
  userId?: string,
  startDate?: string | null,
  dueDate?: string | null
): Promise<Card> => {
  const { data } = await api.post('/cards', {
    title,
    listId,
    order,
    priority,
    userId,
    startDate,
    dueDate,
  });
  return data;
};

export const getCard = async (cardId: string): Promise<Card> => {
  const { data } = await api.get(`/cards/${cardId}`);
  return data;
};

export const moveCard = async (cardId: string, listId: string, order: number, userId?: string): Promise<Card> => {
  const { data } = await api.patch(`/cards/${cardId}/move`, { listId, order, userId });
  return data;
};

export const updateCard = async (cardId: string, updates: Partial<Card> & { userId?: string }): Promise<Card> => {
  const { data } = await api.patch(`/cards/${cardId}`, updates);
  return data;
};

// =============== USERS ===============
export const getUsers = async (skip = 0, take = 50, search?: string): Promise<{ users: User[]; total: number }> => {
  const { data } = await api.get('/users', { params: { skip, take, search } });
  return data;
};

export const searchUsers = async (query: string): Promise<User[]> => {
  const { data } = await api.get('/users/search', { params: { q: query } });
  return data;
};

export const getUser = async (userId: string): Promise<User> => {
  const { data } = await api.get(`/users/${userId}`);
  return data;
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
  const { data } = await api.patch(`/users/${userId}`, updates);
  return data;
};

// =============== TAGS ===============
export const getTags = async (workspaceId: string): Promise<Tag[]> => {
  const { data } = await api.get('/tags', { params: { workspaceId } });
  return data;
};

export const getTag = async (tagId: string): Promise<Tag> => {
  const { data } = await api.get(`/tags/${tagId}`);
  return data;
};

export const createTag = async (name: string, color: string, workspaceId: string): Promise<Tag> => {
  const { data } = await api.post('/tags', { name, color, workspaceId });
  return data;
};

export const updateTag = async (tagId: string, updates: Partial<Tag>): Promise<Tag> => {
  const { data } = await api.patch(`/tags/${tagId}`, updates);
  return data;
};

export const deleteTag = async (tagId: string): Promise<void> => {
  await api.delete(`/tags/${tagId}`);
};

// =============== CARD TAGS ===============
export const addTagToCard = async (cardId: string, tagId: string, userId?: string): Promise<void> => {
  await api.post(`/cards/${cardId}/tags`, { tagId, userId });
};

export const removeTagFromCard = async (cardId: string, tagId: string, userId?: string): Promise<void> => {
  await api.delete(`/cards/${cardId}/tags/${tagId}`, { data: { userId } });
};

// =============== COMMENTS ===============
export const getComments = async (cardId: string): Promise<Comment[]> => {
  const { data } = await api.get('/comments', { params: { cardId } });
  return data;
};

export const createComment = async (content: string, cardId: string, userId: string): Promise<Comment> => {
  const { data } = await api.post('/comments', { content, cardId, userId });
  return data;
};

export const updateComment = async (commentId: string, content: string, userId?: string): Promise<Comment> => {
  const { data } = await api.patch(`/comments/${commentId}`, { content, userId });
  return data;
};

export const deleteComment = async (commentId: string, userId?: string): Promise<void> => {
  await api.delete(`/comments/${commentId}`, { data: { userId } });
};

// =============== ACTIVITIES ===============
export const getActivities = async (cardId: string, limit = 50): Promise<Activity[]> => {
  const { data } = await api.get('/activities', { params: { cardId, limit } });
  return data;
};

export const getActivity = async (activityId: string): Promise<Activity> => {
  const { data } = await api.get(`/activities/${activityId}`);
  return data;
};

// =============== AUTH ===============
export const loginUser = async (email: string, password: string): Promise<{ user: User }> => {
  const { data } = await api.post('/auth/login', { email, password });
  // Token is now in httpOnly cookie, automatically managed by browser
  return data;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
  const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
  return data;
};

export const logoutUser = async (): Promise<{ message: string }> => {
  const { data } = await api.post('/auth/logout');
  return data;
};

// =============== WORKSPACE MEMBERS ===============
export const addWorkspaceMember = async (
  workspaceId: string,
  email: string,
  role: string
): Promise<any> => {
  // First, search for user by email
  const users = await searchUsers(email);
  if (users.length === 0) {
    throw new Error('User not found');
  }
  const userId = users[0].id;
  
  const { data } = await api.post(`/workspaces/${workspaceId}/members`, { userId, role });
  return data;
};

export const getWorkspaceMembers = async (workspaceId: string): Promise<any[]> => {
  const { data } = await api.get(`/workspaces/${workspaceId}/members`);
  return data;
};

export const updateWorkspaceMemberRole = async (
  workspaceId: string,
  memberId: string,
  role: string
): Promise<any> => {
  const { data } = await api.patch(`/workspaces/${workspaceId}/members/${memberId}`, { role });
  return data;
};

export const removeWorkspaceMember = async (
  workspaceId: string,
  memberId: string
): Promise<void> => {
  await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
};

// =============== BOARD MEMBERS ===============
export const addBoardMember = async (
  boardId: string,
  email: string,
  role: string
): Promise<any> => {
  // First, search for user by email
  const users = await searchUsers(email);
  if (users.length === 0) {
    throw new Error('User not found');
  }
  const userId = users[0].id;
  
  const { data } = await api.post(`/boards/${boardId}/members`, { userId, role });
  return data;
};

export const getBoardMembers = async (boardId: string): Promise<any[]> => {
  const { data } = await api.get(`/boards/${boardId}/members`);
  return data;
};

export const updateBoardMemberRole = async (
  boardId: string,
  memberId: string,
  role: string
): Promise<any> => {
  const { data } = await api.patch(`/boards/${boardId}/members/${memberId}`, { role });
  return data;
};

export const removeBoardMember = async (
  boardId: string,
  memberId: string
): Promise<void> => {
  await api.delete(`/boards/${boardId}/members/${memberId}`);
};

// ============================================================================
// INVITATIONS
// ============================================================================

export const sendWorkspaceInvitation = async (
  workspaceId: string,
  email: string,
  role: string
): Promise<any> => {
  const { data } = await api.post(`/workspaces/${workspaceId}/invitations`, {
    email,
    role,
  });
  return data;
};

export const getWorkspaceInvitations = async (workspaceId: string): Promise<any> => {
  const { data } = await api.get(`/workspaces/${workspaceId}/invitations`);
  return data;
};

export const cancelWorkspaceInvitation = async (
  workspaceId: string,
  invitationId: string
): Promise<void> => {
  await api.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`);
};

export const acceptInvitation = async (token: string, userId: string): Promise<any> => {
  const { data } = await api.post(`/invitations/${token}/accept`, { userId });
  return data;
};

export const sendBoardInvitation = async (
  boardId: string,
  email: string,
  role: string
): Promise<any> => {
  const { data } = await api.post(`/boards/${boardId}/invitations`, {
    email,
    role,
  });
  return data;
};

export const getBoardInvitations = async (boardId: string): Promise<any> => {
  const { data } = await api.get(`/boards/${boardId}/invitations`);
  return data;
};

export const cancelBoardInvitation = async (
  boardId: string,
  invitationId: string
): Promise<void> => {
  await api.delete(`/boards/${boardId}/invitations/${invitationId}`);
};