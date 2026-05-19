export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type BoardRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'COMMENTER' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  department?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const MOCK_USERS: User[] = [
  { 
    id: 'user-1', 
    name: 'Abel', 
    email: 'abel@example.com', 
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Abel',
    bio: 'Project Lead',
    department: 'Engineering'
  },
  { 
    id: 'user-2', 
    name: 'Dummy', 
    email: 'dummy@example.com', 
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dummy',
    bio: 'Developer',
    department: 'Engineering'
  },
];

export interface Tag {
  id: string;
  name: string;
  color: string; // HEX color
  workspaceId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CardTag {
  id: string;
  cardId: string;
  tagId: string;
  tag?: Tag;
}

export interface Comment {
  id: string;
  content: string;
  cardId: string;
  userId: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  action: string; // 'created', 'updated', 'moved', 'tag_added', etc.
  description?: string;
  cardId: string;
  userId: string;
  user?: User;
  createdAt: string;
}

export interface Card {
  id: string;
  title: string;
  description: string | null;
  order: number;
  listId: string;
  assigneeId?: string;
  priority?: Priority;
  startDate?: string | null;
  dueDate?: string | null;
  isCompleted?: boolean;
  assignee?: User;
  tags?: CardTag[];
  comments?: Comment[];
  activities?: Activity[];
  createdAt?: string;
  updatedAt?: string;
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
  ownerId?: string;
  lists: List[];
  boardMembers?: BoardMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  ownerId?: string;
  boards?: Board[];
  workspaceMembers?: WorkspaceMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  joinedAt: string;
  user?: User;
}

export interface BoardMember {
  id: string;
  userId: string;
  boardId: string;
  role: BoardRole;
  joinedAt: string;
  user?: User;
}