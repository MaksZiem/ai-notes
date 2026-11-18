import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
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

  @ApiPropertyOptional({ type: () => User })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;

  @ApiHideProperty()
  @ManyToOne(() => Project, (project) => project.members, {
    onDelete: 'CASCADE',
  })
  project: Project;

  @Column()
  projectId: number;

  @ApiProperty({ enum: AccessLevel })
  @Column({ type: 'enum', enum: AccessLevel, default: AccessLevel.VIEW })
  accessLevel: AccessLevel;
}
