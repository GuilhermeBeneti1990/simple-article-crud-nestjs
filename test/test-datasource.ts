import { DataSource } from 'typeorm';
import { User } from '../src/entities/user.entity';
import { Permission } from '../src/entities/permission.entity';
import { Article } from '../src/entities/article.entity';

export const TestDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  dropSchema: true,
  entities: [User, Permission, Article],
  synchronize: true,
  logging: false,
});
