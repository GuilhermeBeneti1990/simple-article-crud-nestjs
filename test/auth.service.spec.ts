import { TestDataSource } from './test-datasource';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import * as bcrypt from 'bcrypt';
import { Permission } from '../src/entities/permission.entity';

describe('AuthService (unit)', () => {
  beforeAll(async () => {
    await TestDataSource.initialize();
    const permRepo = TestDataSource.getRepository(Permission);
    await permRepo.save({ name: 'READER', description: 'reader' });
  });

  afterAll(async () => {
    await TestDataSource.destroy();
  });

  it('validateUser and login', async () => {
    const usersSvc = new UsersService();
    (usersSvc as any).repo = TestDataSource.getRepository('User');
    (usersSvc as any).permRepo = TestDataSource.getRepository(Permission);

    const hashed = await bcrypt.hash('rootpass', 10);
    const userRepo = TestDataSource.getRepository('User');
    const perm = await TestDataSource.getRepository(Permission).findOneBy({ name: 'READER' });
    const created = await userRepo.save({ name: 'AuthUser', email: 'root@example.com', password: hashed, permission: perm });

    const authSvc = new AuthService({} as any);
    (authSvc as any).userRepo = TestDataSource.getRepository('User');
    const valid = await authSvc.validateUser('root@example.com','rootpass');
    expect(valid).not.toBeNull();

    const token = await authSvc.login({ id: created.id, email: created.email, permission: perm });
    expect(token.access_token).toBeDefined();
  });
});
