import axios from 'axios';
import type { Workspace, Board, List, Card } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
});

export const fetchWorkspaces = async (): Promise<Workspace[]> => {
  const { data } = await api.get('/workspaces');
  return data;
};

export const fetchBoards = async (): Promise<Board[]> => {
  const { data } = await api.get('/boards');
  return data;
};

export const createWorkspace = async (name: string, description?: string): Promise<Workspace> => {
  const { data } = await api.post('/workspaces', { name, description });
  return data;
};

export const createBoard = async (name: string, workspaceId: string, background?: string): Promise<Board> => {
  const { data } = await api.post('/boards', { name, workspaceId, background });
  return data;
};

export const createList = async (name: string, boardId: string, order: number): Promise<List> => {
  const { data } = await api.post('/lists', { name, boardId, order });
  return data;
};

export const createCard = async (title: string, listId: string, order: number): Promise<Card> => {
  const { data } = await api.post('/cards', { title, listId, order });
  return data;
};

export const moveCard = async (cardId: string, listId: string, order: number): Promise<Card> => {
  const { data } = await api.patch(`/cards/${cardId}/move`, { listId, order });
  return data;
};