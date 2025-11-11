import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Permission } from './entities/permission.entity';
import { User } from './entities/user.entity';
import { Article } from './entities/article.entity';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: +(process.env.DATABASE_PORT || 5432),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'articles_db',
  entities: [Permission, User, Article],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: false,
});
