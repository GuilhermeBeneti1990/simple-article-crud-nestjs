import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // 'ADMIN', 'EDITOR', 'READER'

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => User, user => user.permission)
  users: User[];
}
