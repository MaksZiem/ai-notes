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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token: string;

  @ApiHideProperty()
  @ManyToOne(() => Note, { onDelete: 'CASCADE' })
  note: Note;

  @Column('uuid')
  noteId: string;

  @ApiProperty({ enum: AccessLevel })
  @Column({ type: 'enum', enum: AccessLevel, default: AccessLevel.VIEW })
  accessLevel: AccessLevel;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ default: false })
  revoked: boolean;

  @Column('uuid')
  createdByUserId: string;

  @CreateDateColumn()
  createdAt: Date;
}
