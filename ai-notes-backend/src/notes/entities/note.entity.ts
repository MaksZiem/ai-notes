import { User } from 'src/users/user.entity';
import { Project } from 'src/projects/entities/project.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NoteMember } from './note-member.entity';

@Entity()
export class Note {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'simple-array', nullable: true })
  keywords: string[];

  @Column({ nullable: true })
  color: string;

  @ManyToOne(() => Project, (project) => project.notes, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  project: Project | null;

  @Column({ nullable: true })
  projectId: number | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  owner: User;

  @Column()
  ownerId: number;

  @OneToMany(() => NoteMember, (member) => member.note)
  members: NoteMember[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
