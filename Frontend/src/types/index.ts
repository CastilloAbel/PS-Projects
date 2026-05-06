export interface Card {
  id: string;
  title: string;
  description: string | null;
  order: number;
  listId: string;
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