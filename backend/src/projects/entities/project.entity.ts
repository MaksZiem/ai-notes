import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

  @ApiPropertyOptional({ type: String, nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Column({ nullable: true })
  color: string;

  @ApiHideProperty()
  @ManyToOne(() => User, (user) => user.projects, { onDelete: 'CASCADE' })
  owner: User;

  @Column()
  ownerId: number;

  @ApiHideProperty()
  @OneToMany(() => Note, (note) => note.project)
  notes: Note[];

  @ApiHideProperty()
  @OneToMany(() => ProjectMember, (member) => member.project)
  members: ProjectMember[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
