import { User } from 'src/users/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { AccessLevel } from 'src/enums/access-level.enum';
import { Note } from './note.entity';

@Entity()
@Unique(['userId', 'noteId'])
export class NoteMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Note, (note) => note.members, { onDelete: 'CASCADE' })
  note: Note;

  @Column()
  noteId: number;

  /** VIEW < EDIT < DELETE (addytywne) */
  @Column({ type: 'enum', enum: AccessLevel, default: AccessLevel.VIEW })
  accessLevel: AccessLevel;
}