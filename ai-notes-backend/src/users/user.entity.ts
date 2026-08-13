import { Exclude } from 'class-transformer';
import { UserRole } from 'src/enums/user-role.enum';
import { Project } from 'src/projects/entities/project.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Exclude()
  @Column()
  password: string;

  @Column({unique: true})
  email: string;

  @Column()
  name: string;

  @Column()
  surname: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @OneToMany(() => Project, (project) => project.owner)
  projects: Project[];
}
