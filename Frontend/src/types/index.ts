export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export const MOCK_USERS: User[] = [
  { id: 'user-1', name: 'Abel', email: 'abel@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Abel' },
  { id: 'user-2', name: 'Dummy', email: 'dummy@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dummy' },
];

export interface Card {
  id: string;
  title: string;
  description: string | null;
  order: number;
  listId: string;
  assigneeId?: string;
}

export interface List {
  id: string;
  name: string;
  order: number;
  boardId: string;
  cards: Card[];
}

export interface Board {
  id: string;
  name: string;
  background: string | null;
  workspaceId: string;
  lists: List[];
}

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  boards: Board[];
}