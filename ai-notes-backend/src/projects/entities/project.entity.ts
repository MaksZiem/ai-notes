import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectMember } from './project-member.entity';
import { Note } from 'src/notes/entities/note.entity';

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  color: string;

  @ManyToOne(() => User, (user) => user.projects, { onDelete: 'CASCADE' })
  owner: User;

  @Column()
  ownerId: number;

  @OneToMany(() => Note, (note) => note.project)
  notes: Note[];

  @OneToMany(() => ProjectMember, (member) => member.project)
  members: ProjectMember[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}