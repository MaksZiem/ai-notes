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

  // odbiorca powiadomienia
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  // kto wywołał zdarzenie (np. kto udostępnił notatkę/projekt)
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  actor: User | null;

  @Column({ nullable: true })
  actorId: number | null;

  // notatka, której dotyczy powiadomienie
  @ManyToOne(() => Note, { onDelete: 'CASCADE', nullable: true })
  note: Note | null;

  @Column({ nullable: true })
  noteId: number | null;

  // projekt, którego dotyczy powiadomienie
  @ManyToOne(() => Project, { onDelete: 'CASCADE', nullable: true })
  project: Project | null;

  @Column({ nullable: true })
  projectId: number | null;

  @Column({ type: 'enum', enum: AccessLevel, nullable: true })
  accessLevel: AccessLevel | null;

  // link udostępniania notatki, którego dotyczy zaproszenie (tylko dla NOTE_INVITE)
  @ManyToOne(() => NoteShareLink, { onDelete: 'CASCADE', nullable: true })
  shareLink: NoteShareLink | null;

  @Column({ nullable: true })
  shareLinkId: number | null;

  // link udostępniania projektu, którego dotyczy zaproszenie (tylko dla PROJECT_INVITE)
  @ManyToOne(() => ProjectShareLink, { onDelete: 'CASCADE', nullable: true })
  projectShareLink: ProjectShareLink | null;

  @Column({ nullable: true })
  projectShareLinkId: number | null;

  // stan akceptacji — tylko dla *_INVITE, dla reszty typów pozostaje null
  @Column({ type: 'enum', enum: NotificationStatus, nullable: true })
  status: NotificationStatus | null;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
