import { TestDataSource } from './test-datasource';
import { UsersService } from '../src/users/users.service';
import { Permission } from '../src/entities/permission.entity';

describe('UsersService (unit)', () => {
  beforeAll(async () => {
    await TestDataSource.initialize();
    const permRepo = TestDataSource.getRepository(Permission);
    await permRepo.save({ name: 'READER', description: 'reader' });
    await permRepo.save({ name: 'ADMIN', description: 'admin' });
  });

  afterAll(async () => {
    await TestDataSource.destroy();
  });

  it('should create and find a user', async () => {
    const svc = new UsersService();
    (svc as any).repo = TestDataSource.getRepository('User');
    (svc as any).permRepo = TestDataSource.getRepository(Permission);

    const u = await svc.create({ name: 'T1', email: 't1@example.com', password: 'pass', permissionName: 'READER' });
    expect(u.email).toBe('t1@example.com');

    const all = await svc.findAll();
    expect(all.length).toBeGreaterThan(0);

    const found = await svc.findOne(u.id);
    expect(found.email).toBe('t1@example.com');
  }, 20000);
});
