import type { Project } from "./project";
import type { AccessLevel } from "./note-share-links";

export interface NoteOwner {
  id: string;
  name: string;
  surname: string;
  email: string;
}

export interface Note {
  id: string;
  title: string;
  content?: string;
  color?: string;
  projectId: string | null;
  project: Project | null;
  ownerId: string;
  owner?: NoteOwner;
  keywords?: string[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  accessLevel?: AccessLevel;
}