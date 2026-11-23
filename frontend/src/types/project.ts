export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  accessLevel: "VIEW" | "EDIT" | "DELETE";
  user: {
    id: string;
    name: string;
    surname: string;
    email: string;
  };
}