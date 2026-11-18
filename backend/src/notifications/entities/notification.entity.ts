import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/users/user.entity';
import { Note } from 'src/notes/entities/note.entity';
import { NoteShareLink } from 'src/notes/entities/note-share-link.entity';
import { Project } from 'src/projects/entities/project.entity';
import { ProjectShareLink } from 'src/projects/entities/project-share-link.entity';
import { NotificationType } from 'src/enums/notification-type.enum';
import { NotificationStatus } from 'src/enums/notification-status.enum';
import { AccessLevel } from 'src/enums/access-level.enum';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiHideProperty()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @ApiPropertyOptional({ type: () => User, nullable: true })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  actor: User | null;

  @Column({ nullable: true })
  actorId: number | null;

  @ApiPropertyOptional({ type: () => Note, nullable: true })
  @ManyToOne(() => Note, { onDelete: 'CASCADE', nullable: true })
  note: Note | null;

  @Column({ nullable: true })
  noteId: number | null;

  @ApiPropertyOptional({ type: () => Project, nullable: true })
  @ManyToOne(() => Project, { onDelete: 'CASCADE', nullable: true })
  project: Project | null;

  @Column({ nullable: true })
  projectId: number | null;

  @Column({ type: 'enum', enum: AccessLevel, nullable: true })
  accessLevel: AccessLevel | null;

  @ApiHideProperty()
  @ManyToOne(() => NoteShareLink, { onDelete: 'CASCADE', nullable: true })
  shareLink: NoteShareLink | null;

  @Column({ nullable: true })
  shareLinkId: number | null;

  @ApiHideProperty()
  @ManyToOne(() => ProjectShareLink, { onDelete: 'CASCADE', nullable: true })
  projectShareLink: ProjectShareLink | null;

  @Column({ nullable: true })
  projectShareLinkId: number | null;

  @Column({ type: 'enum', enum: NotificationStatus, nullable: true })
  status: NotificationStatus | null;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
