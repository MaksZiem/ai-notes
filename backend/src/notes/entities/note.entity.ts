import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from 'src/users/user.entity';
import { Project } from 'src/projects/entities/project.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NoteMember } from './note-member.entity';

@Entity()
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Column({ type: 'text', nullable: true })
  content: string;

  @ApiPropertyOptional({ type: [String], nullable: true })
  @Column({ type: 'simple-array', nullable: true })
  keywords: string[];

  @ApiPropertyOptional({ type: String, nullable: true })
  @Column({ nullable: true })
  color: string;

  @ApiPropertyOptional({ type: () => Project, nullable: true })
  @ManyToOne(() => Project, (project) => project.notes, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  project: Project | null;

  @Column({ type: 'uuid', nullable: true })
  projectId: string | null;

  @ApiPropertyOptional({ type: () => User })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  owner: User;

  @Column('uuid')
  ownerId: string;

  @ApiHideProperty()
  @OneToMany(() => NoteMember, (member) => member.note)
  members: NoteMember[];

  @ApiPropertyOptional({
    description: 'Wektor do wyszukiwania semantycznego',
    type: [Number],
    nullable: true,
  })
  @Column({ type: 'jsonb', nullable: true })
  embedding: number[] | null;

  @ApiHideProperty()
  @Column({ type: 'bytea', nullable: true })
  yjsState: Buffer | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
