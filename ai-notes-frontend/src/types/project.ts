export interface Project {
  id: number;
  name: string;
  description?: string;
  color?: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}