import { ApiHideProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from 'src/users/user.entity';
import { Note } from './note.entity';

@Entity()
@Unique(['userId', 'noteId'])
export class UserNotePreference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  noteId: number;

  @Column({ default: false })
  isPinned: boolean;

  @Column({ default: false })
  isFavourite: boolean;

  @ApiHideProperty()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ApiHideProperty()
  @ManyToOne(() => Note, { onDelete: 'CASCADE' })
  note: Note;
}
