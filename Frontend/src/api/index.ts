import axios from 'axios';
import type { Workspace, Board, List, Card, User, Tag, Comment, Activity } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
});

// Add JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =============== WORKSPACES ===============
export const fetchWorkspaces = async (): Promise<Workspace[]> => {
  const { data } = await api.get('/workspaces');
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

export const createBoard = async (name: string, workspaceId: string, background?: string): Promise<Board> => {
  const { data } = await api.post('/boards', { name, workspaceId, background });
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
export const createCard = async (title: string, listId: string, order: number, priority?: string, userId?: string): Promise<Card> => {
  const { data } = await api.post('/cards', { title, listId, order, priority, userId });
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
export const loginUser = async (email: string, password: string): Promise<{ token: string; user: User }> => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
  const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
  return data;
};