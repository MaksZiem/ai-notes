import { User } from 'src/users/user.entity';
import { Project } from './project.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { AccessLevel } from 'src/enums/access-level.enum';

@Entity()
@Unique(['userId', 'projectId'])
export class ProjectMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Project, (project) => project.members, {
    onDelete: 'CASCADE',
  })
  project: Project;

  @Column()
  projectId: number;

  @Column({ type: 'enum', enum: AccessLevel, default: AccessLevel.VIEW })
  accessLevel: AccessLevel;
}