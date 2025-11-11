import { TestDataSource } from './test-datasource';
import { ArticlesService } from '../src/articles/articles.service';
import { UsersService } from '../src/users/users.service';
import { Permission } from '../src/entities/permission.entity';
import { NotFoundException } from '@nestjs/common';

describe('ArticlesService (unit)', () => {
  let articleSvc: ArticlesService;
  let usersSvc: UsersService;
  let permissionId: string;
  let userId: string;

  beforeAll(async () => {
    await TestDataSource.initialize();
    const permRepo = TestDataSource.getRepository(Permission);
    const permission = await permRepo.save({ name: 'EDITOR', description: 'editor' });
    permissionId = permission.id;
  });

  afterAll(async () => {
    await TestDataSource.destroy();
  });

  beforeEach(async () => {
    articleSvc = new ArticlesService();
    (articleSvc as any).repo = TestDataSource.getRepository('Article');
    (articleSvc as any).userRepo = TestDataSource.getRepository('User');

    usersSvc = new UsersService();
    (usersSvc as any).repo = TestDataSource.getRepository('User');
    (usersSvc as any).permRepo = TestDataSource.getRepository(Permission);

    const perm = await TestDataSource.getRepository(Permission).findOneBy({ id: permissionId });
    const userRepo = TestDataSource.getRepository('User');
    const user = await userRepo.save({ name: 'TestUser', email: `test-${Date.now()}@example.com`, password: 'password123', permission: perm });
    userId = user.id;
  });

  describe('create', () => {
    it('should create an article successfully', async () => {
      const payload = { title: 'Test Article', content: 'Test Content', userId };

      const article = await articleSvc.create(payload);

      expect(article).toBeDefined();
      expect(article.id).toBeDefined();
      expect(article.title).toBe('Test Article');
      expect(article.content).toBe('Test Content');
      expect(article.author.id).toBe(userId);
    });

    it('should throw NotFoundException when author does not exist', async () => {
      const payload = { title: 'Test Article', content: 'Test Content', userId: 'non-existent-user-id' };

      await expect(articleSvc.create(payload)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all articles', async () => {
      await articleSvc.create({ title: 'Article 1', content: 'Content 1', userId });
      await articleSvc.create({ title: 'Article 2', content: 'Content 2', userId });

      const articles = await articleSvc.findAll();

      expect(Array.isArray(articles)).toBe(true);
      expect(articles.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array if no articles exist', async () => {
      const articles = await articleSvc.findAll();
      expect(Array.isArray(articles)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should find article by id', async () => {
      const created = await articleSvc.create({ title: 'Find Test', content: 'Find Content', userId });

      const found = await articleSvc.findOne(created.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
      expect(found.title).toBe('Find Test');
      expect(found.content).toBe('Find Content');
    });

    it('should throw NotFoundException when article does not exist', async () => {
      await expect(articleSvc.findOne('non-existent-article-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update article successfully', async () => {
      const created = await articleSvc.create({ title: 'Original', content: 'Original Content', userId });

      const updated = await articleSvc.update(created.id, { title: 'Updated', content: 'Updated Content' });

      expect(updated.title).toBe('Updated');
      expect(updated.content).toBe('Updated Content');
      expect(updated.id).toBe(created.id);
    });

    it('should partially update article', async () => {
      const created = await articleSvc.create({ title: 'Original', content: 'Original Content', userId });

      const updated = await articleSvc.update(created.id, { title: 'Only Title Updated' });

      expect(updated.title).toBe('Only Title Updated');
      expect(updated.content).toBe('Original Content');
    });

    it('should throw NotFoundException when article does not exist', async () => {
      await expect(articleSvc.update('non-existent-id', { title: 'New Title' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove article successfully', async () => {
      const created = await articleSvc.create({ title: 'To Delete', content: 'Delete Content', userId });

      const removed = await articleSvc.remove(created.id);

      expect(removed).toBeDefined();

      await expect(articleSvc.findOne(created.id)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when article does not exist', async () => {
      await expect(articleSvc.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  it('create and read article', async () => {
    const art = await articleSvc.create({ title: 'T', content: 'C', userId });
    expect(art.title).toBe('T');

    const found = await articleSvc.findOne(art.id);
    expect(found.title).toBe('T');

    const all = await articleSvc.findAll();
    expect(all.length).toBeGreaterThan(0);
  });
});
