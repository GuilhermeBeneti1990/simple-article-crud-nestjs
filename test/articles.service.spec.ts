import { TestDataSource } from './test-datasource';
import { ArticlesService } from '../src/articles/articles.service';
import { UsersService } from '../src/users/users.service';
import { Permission } from '../src/entities/permission.entity';

describe('ArticlesService (unit)', () => {
  beforeAll(async () => {
    await TestDataSource.initialize();
    const permRepo = TestDataSource.getRepository(Permission);
    await permRepo.save({ name: 'EDITOR', description: 'editor' });
  });

  afterAll(async () => {
    await TestDataSource.destroy();
  });

  it('create and read article', async () => {
    const usersSvc = new UsersService();
    (usersSvc as any).repo = TestDataSource.getRepository('User');
    (usersSvc as any).permRepo = TestDataSource.getRepository(Permission);

    const perm = await TestDataSource.getRepository(Permission).findOneBy({ name: 'EDITOR' });
    const userRepo = TestDataSource.getRepository('User');
    const user = await userRepo.save({ name: 'ArtUser', email: 'art@example.com', password: 'pw', permission: perm });

    const articleSvc = new ArticlesService();
    (articleSvc as any).repo = TestDataSource.getRepository('Article');
    (articleSvc as any).userRepo = TestDataSource.getRepository('User');

    const art = await articleSvc.create({ title: 'T', content: 'C', userId: user.id });
    expect(art.title).toBe('T');

    const found = await articleSvc.findOne(art.id);
    expect(found.title).toBe('T');

    const all = await articleSvc.findAll();
    expect(all.length).toBeGreaterThan(0);
  });
});
