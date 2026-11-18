import { ApiHideProperty } from '@nestjs/swagger';
import { User } from 'src/users/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Project } from './project.entity';

@Entity()
@Unique(['userId', 'projectId'])
export class UserProjectPreference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  projectId: number;

  @Column({ default: false })
  isPinned: boolean;

  @Column({ default: false })
  isFavourite: boolean;

  @ApiHideProperty()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ApiHideProperty()
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;
}
