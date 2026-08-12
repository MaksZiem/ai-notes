// types/user.ts
export type UserRole = 'USER' | 'ADMIN'

export interface User {
  id: number;
  email: string;
  role: UserRole;
}