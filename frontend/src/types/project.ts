export interface Project {
  id: number;
  name: string;
  description?: string;
  color?: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: number;
  userId: number;
  projectId: number;
  accessLevel: "VIEW" | "EDIT" | "DELETE";
  user: {
    id: number;
    name: string;
    surname: string;
    email: string;
  };
}