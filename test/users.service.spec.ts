import { TestDataSource } from './test-datasource';
import { UsersService } from '../src/users/users.service';
import { Permission } from '../src/entities/permission.entity';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UsersService (unit)', () => {
  let userSvc: UsersService;

  beforeAll(async () => {
    await TestDataSource.initialize();
    const permRepo = TestDataSource.getRepository(Permission);
    await permRepo.save({ name: 'READER', description: 'reader' });
    await permRepo.save({ name: 'ADMIN', description: 'admin' });
    await permRepo.save({ name: 'EDITOR', description: 'editor' });
  }, 20000);

  afterAll(async () => {
    await TestDataSource.destroy();
  });

  beforeEach(async () => {
    userSvc = new UsersService();
    (userSvc as any).repo = TestDataSource.getRepository('User');
    (userSvc as any).permRepo = TestDataSource.getRepository(Permission);
  });

  describe('create', () => {
    it('should create a user with default READER permission', async () => {
      const userData = { name: 'DefaultUser', email: `default-${Date.now()}@example.com`, password: 'password123' };

      const user = await userSvc.create(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.name).toBe('DefaultUser');
      expect(user.email).toBe(userData.email);
      expect(user.permission).toBeDefined();
      expect(user.permission.name).toBe('READER');
    });

    it('should create a user with specified permission', async () => {
      const userData = { name: 'AdminUser', email: `admin-${Date.now()}@example.com`, password: 'password123', permissionName: 'ADMIN' };

      const user = await userSvc.create(userData);

      expect(user).toBeDefined();
      expect(user.permission.name).toBe('ADMIN');
    });

    it('should hash the password', async () => {
      const password = 'myPassword123';
      const userData = { name: 'HashTest', email: `hash-${Date.now()}@example.com`, password };

      const user = await userSvc.create(userData);

      expect(user.password).not.toBe(password);
      const isMatch = await bcrypt.compare(password, user.password);
      expect(isMatch).toBe(true);
    });

    it('should throw error if user already exists', async () => {
      const email = `duplicate-${Date.now()}@example.com`;
      const userData = { name: 'User1', email, password: 'pass' };

      await userSvc.create(userData);

      await expect(userSvc.create({ ...userData, name: 'User2' })).rejects.toThrow('User already exists');
    });

    it('should create user with EDITOR permission', async () => {
      const userData = { name: 'EditorUser', email: `editor-${Date.now()}@example.com`, password: 'password123', permissionName: 'EDITOR' };

      const user = await userSvc.create(userData);

      expect(user.permission.name).toBe('EDITOR');
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      await userSvc.create({ name: 'User1', email: `user1-${Date.now()}@example.com`, password: 'pass' });
      await userSvc.create({ name: 'User2', email: `user2-${Date.now()}@example.com`, password: 'pass' });

      const users = await userSvc.findAll();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThanOrEqual(2);
    });

    it('should return users with all properties', async () => {
      await userSvc.create({ name: 'TestUser', email: `test-${Date.now()}@example.com`, password: 'pass', permissionName: 'ADMIN' });

      const users = await userSvc.findAll();

      expect(users[0]).toHaveProperty('id');
      expect(users[0]).toHaveProperty('name');
      expect(users[0]).toHaveProperty('email');
      expect(users[0]).toHaveProperty('password');
      expect(users[0]).toHaveProperty('permission');
    });
  });

  describe('findOne', () => {
    it('should find user by id', async () => {
      const created = await userSvc.create({ name: 'FindTest', email: `find-${Date.now()}@example.com`, password: 'pass' });

      const found = await userSvc.findOne(created.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
      expect(found.name).toBe('FindTest');
      expect(found.email).toBe(created.email);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      await expect(userSvc.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should return user with permission', async () => {
      const created = await userSvc.create({ name: 'WithPerm', email: `perm-${Date.now()}@example.com`, password: 'pass', permissionName: 'ADMIN' });

      const found = await userSvc.findOne(created.id);

      expect(found.permission).toBeDefined();
      expect(found.permission.name).toBe('ADMIN');
    });
  });

  describe('update', () => {
    it('should update user name', async () => {
      const created = await userSvc.create({ name: 'Original', email: `orig-${Date.now()}@example.com`, password: 'pass' });

      const updated = await userSvc.update(created.id, { name: 'Updated' });

      expect(updated.name).toBe('Updated');
      expect(updated.email).toBe(created.email);
      expect(updated.id).toBe(created.id);
    });

    it('should update user password', async () => {
      const created = await userSvc.create({ name: 'PassUser', email: `pass-${Date.now()}@example.com`, password: 'oldpass' });
      const newPassword = 'newpass123';

      const updated = await userSvc.update(created.id, { password: newPassword });

      expect(updated.password).not.toBe(created.password);
      const isMatch = await bcrypt.compare(newPassword, updated.password);
      expect(isMatch).toBe(true);
    });

    it('should update multiple properties at once', async () => {
      const created = await userSvc.create({ name: 'Multi', email: `multi-123@example.com`, password: 'pass' });

      const updated = await userSvc.update(created.id, { name: 'NewName', email: `newemail-123@example.com` });

      expect(updated.name).toBe('NewName');
      expect(updated.email).toBe(`newemail-123@example.com`);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      await expect(userSvc.update('non-existent-id', { name: 'New' })).rejects.toThrow(NotFoundException);
    });

    it('should hash password when updating', async () => {
      const created = await userSvc.create({ name: 'HashUpdate', email: `hashupd-${Date.now()}@example.com`, password: 'pass' });
      const newPassword = 'brandnewpass';

      const updated = await userSvc.update(created.id, { password: newPassword });

      const isMatch = await bcrypt.compare(newPassword, updated.password);
      expect(isMatch).toBe(true);
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      const created = await userSvc.create({ name: 'ToDelete', email: `delete-${Date.now()}@example.com`, password: 'pass' });

      const removed = await userSvc.remove(created.id);

      expect(removed).toBeDefined();

      await expect(userSvc.findOne(created.id)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      await expect(userSvc.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const email = `email-search-${Date.now()}@example.com`;
      const created = await userSvc.create({ name: 'EmailTest', email, password: 'pass' });

      const found = await userSvc.findByEmail(email);

      expect(found).toBeDefined();
      expect(found.email).toBe(email);
      expect(found.id).toBe(created.id);
    });

    it('should return null when email does not exist', async () => {
      const found = await userSvc.findByEmail('nonexistent@example.com');

      expect(found).toBeNull();
    });

    it('should return user with permission', async () => {
      const email = `email-perm-${Date.now()}@example.com`;
      const created = await userSvc.create({ name: 'WithPermEmail', email, password: 'pass', permissionName: 'EDITOR' });

      const found = await userSvc.findByEmail(email);

      expect(found.permission).toBeDefined();
      expect(found.permission.name).toBe('EDITOR');
    });
  });

  describe('Integration scenarios', () => {
    it('should create and find a user', async () => {
      const u = await userSvc.create({ name: 'T1', email: `t1-${Date.now()}@example.com`, password: 'pass', permissionName: 'READER' });
      expect(u.email).toBe(u.email);

      const all = await userSvc.findAll();
      expect(all.length).toBeGreaterThan(0);

      const found = await userSvc.findOne(u.id);
      expect(found.email).toBe(u.email);
    });

    it('should create, update, and verify user', async () => {
      const email = `workflow-${Date.now()}@example.com`;
      const created = await userSvc.create({ name: 'Workflow', email, password: 'pass123' });

      const updated = await userSvc.update(created.id, { name: 'UpdatedWorkflow' });
      expect(updated.name).toBe('UpdatedWorkflow');

      const found = await userSvc.findByEmail(email);
      expect(found.name).toBe('UpdatedWorkflow');
    });
  });
});
