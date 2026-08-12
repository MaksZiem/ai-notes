import type { Project } from "./project";

export interface Note {
  id: number;
  title: string;
  content?: string;
  color?: string;
  projectId: number | null;
  project: Project | null;
  ownerId: number;
  keywords?: string[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
}