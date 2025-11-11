import { TestDataSource } from './test-datasource';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import * as bcrypt from 'bcrypt';
import { Permission } from '../src/entities/permission.entity';
import { JwtService } from '@nestjs/jwt';

describe('AuthService (unit)', () => {
  let authSvc: AuthService;
  let jwtService: JwtService;
  let permissionId: string;
  let hashedPassword: string;

  beforeAll(async () => {
    await TestDataSource.initialize();
    const permRepo = TestDataSource.getRepository(Permission);
    const perm = await permRepo.save({ name: 'READER', description: 'reader' });
    permissionId = perm.id;

    // Create a mock JwtService
    jwtService = {
      sign: (payload: any) => {
        return `token_${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
      },
      verify: (token: string) => {
        const payload = Buffer.from(token.replace('token_', ''), 'base64').toString();
        return JSON.parse(payload);
      },
    } as any;

    authSvc = new AuthService(jwtService);
    (authSvc as any).userRepo = TestDataSource.getRepository('User');

    hashedPassword = await bcrypt.hash('testpass123', 10);
  });

  afterAll(async () => {
    await TestDataSource.destroy();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const userRepo = TestDataSource.getRepository('User');
      const perm = await TestDataSource.getRepository(Permission).findOneBy({ id: permissionId });

      const user = await userRepo.save({
        name: 'ValidUser',
        email: `valid-${Date.now()}@example.com`,
        password: hashedPassword,
        permission: perm,
      });

      const result = await authSvc.validateUser(user.email, 'testpass123');

      expect(result).not.toBeNull();
      expect(result.id).toBe(user.id);
      expect(result.email).toBe(user.email);
      expect(result.name).toBe('ValidUser');
      expect(result.password).toBeUndefined();
      expect(result.permission).toBeDefined();
    });

    it('should return null when user does not exist', async () => {
      const result = await authSvc.validateUser('nonexistent@example.com', 'anypassword');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      const userRepo = TestDataSource.getRepository('User');
      const perm = await TestDataSource.getRepository(Permission).findOneBy({ id: permissionId });

      const user = await userRepo.save({
        name: 'InvalidPass',
        email: `invalidpass-${Date.now()}@example.com`,
        password: hashedPassword,
        permission: perm,
      });

      const result = await authSvc.validateUser(user.email, 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should not return password in validated user', async () => {
      const userRepo = TestDataSource.getRepository('User');
      const perm = await TestDataSource.getRepository(Permission).findOneBy({ id: permissionId });

      const user = await userRepo.save({
        name: 'NoPassword',
        email: `nopass-${Date.now()}@example.com`,
        password: hashedPassword,
        permission: perm,
      });

      const result = await authSvc.validateUser(user.email, 'testpass123');

      expect(result).not.toBeNull();
      expect(result.password).toBeUndefined();
    });
  });

  describe('login', () => {
    it('should return access token with correct payload', async () => {
      const userRepo = TestDataSource.getRepository('User');
      const perm = await TestDataSource.getRepository(Permission).findOneBy({ id: permissionId });

      const user = await userRepo.save({
        name: 'LoginUser',
        email: `login-${Date.now()}@example.com`,
        password: hashedPassword,
        permission: perm,
      });

      const result = await authSvc.login({
        id: user.id,
        email: user.email,
        permission: perm,
      });

      expect(result).toBeDefined();
      expect(result.access_token).toBeDefined();
      expect(typeof result.access_token).toBe('string');
    });

    it('should include user id in token payload', async () => {
      const userId = 'test-user-id-123';
      const userEmail = 'token-test@example.com';
      const permissionName = 'READER';

      const result = await authSvc.login({
        id: userId,
        email: userEmail,
        permission: { name: permissionName },
      });

      expect(result.access_token).toBeDefined();
      const decoded = jwtService.verify(result.access_token);
      expect(decoded.sub).toBe(userId);
      expect(decoded.email).toBe(userEmail);
      expect(decoded.permission).toBe(permissionName);
    });

    it('should handle user with no permission', async () => {
      const result = await authSvc.login({
        id: 'user-id',
        email: 'user@example.com',
        permission: null,
      });

      expect(result.access_token).toBeDefined();
      const decoded = jwtService.verify(result.access_token);
      expect(decoded.permission).toBeUndefined();
    });
  });

  describe('Integration: validateUser and login', () => {
    it('should validate user and then login successfully', async () => {
      const userRepo = TestDataSource.getRepository('User');
      const perm = await TestDataSource.getRepository(Permission).findOneBy({ id: permissionId });

      const user = await userRepo.save({
        name: 'IntegrationUser',
        email: `integration-${Date.now()}@example.com`,
        password: hashedPassword,
        permission: perm,
      });

      // Validate user
      const validated = await authSvc.validateUser(user.email, 'testpass123');
      expect(validated).not.toBeNull();

      // Login with validated user
      const loginResult = await authSvc.login(validated);
      expect(loginResult.access_token).toBeDefined();

      // Verify token contains correct data
      const decoded = jwtService.verify(loginResult.access_token);
      expect(decoded.sub).toBe(user.id);
      expect(decoded.email).toBe(user.email);
    });
  });
});
