import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AppDataSource } from '../data-source';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  private userRepo = AppDataSource.getRepository(User);
  constructor(private jwtService: JwtService) {}

  async validateUser(email: string, pass: string) {
    const user = await this.userRepo.findOne({ where: { email }});
    if (!user) return null;
    const match = await bcrypt.compare(pass, user.password);
    if (match) {
      const { password, ...rest } = user as any;
      return rest;
    }
    return null;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, permission: user.permission?.name };
    return { access_token: this.jwtService.sign(payload) };
  }
}
