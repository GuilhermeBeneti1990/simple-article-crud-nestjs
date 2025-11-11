import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Permission } from './permission.entity';
import { Article } from './article.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @ManyToOne(() => Permission, perm => perm.users, { eager: true })
  permission: Permission;

  @OneToMany(() => Article, article => article.author)
  articles: Article[];
}
