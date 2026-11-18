import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { UserRole } from 'src/enums/user-role.enum';
import { Project } from 'src/projects/entities/project.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiHideProperty()
  @Exclude()
  @Column()
  password: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  surname: string;

  @ApiProperty({ enum: UserRole })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @ApiHideProperty()
  @OneToMany(() => Project, (project) => project.owner)
  projects: Project[];
}
