import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AccessLevel } from 'src/enums/access-level.enum';
import { Note } from './note.entity';

@Entity()
export class NoteShareLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  token: string;

  @ApiHideProperty()
  @ManyToOne(() => Note, { onDelete: 'CASCADE' })
  note: Note;

  @Column()
  noteId: number;

  @ApiProperty({ enum: AccessLevel })
  @Column({ type: 'enum', enum: AccessLevel, default: AccessLevel.VIEW })
  accessLevel: AccessLevel;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ default: false })
  revoked: boolean;

  @Column()
  createdByUserId: number;

  @CreateDateColumn()
  createdAt: Date;
}
