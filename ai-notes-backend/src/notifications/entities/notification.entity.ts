import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/users/user.entity';
import { Note } from 'src/notes/entities/note.entity';
import { NotificationType } from 'src/enums/notification-type.enum';
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

  // kto wywołał zdarzenie (np. kto udostępnił notatkę)
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  actor: User | null;

  @Column({ nullable: true })
  actorId: number | null;

  // notatka, której dotyczy powiadomienie
  @ManyToOne(() => Note, { onDelete: 'CASCADE', nullable: true })
  note: Note | null;

  @Column({ nullable: true })
  noteId: number | null;

  @Column({ type: 'enum', enum: AccessLevel, nullable: true })
  accessLevel: AccessLevel | null;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}