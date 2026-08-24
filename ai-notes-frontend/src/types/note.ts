import type { Project } from "./project";
import type { AccessLevel } from "./note-share-links";

export interface NoteOwner {
  id: number;
  name: string;
  surname: string;
  email: string;
}

export interface Note {
  id: number;
  title: string;
  content?: string;
  color?: string;
  projectId: number | null;
  project: Project | null;
  ownerId: number;
  owner?: NoteOwner;
  keywords?: string[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  accessLevel?: AccessLevel;
}