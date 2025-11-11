import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body:any) {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { email: body.email }});
    if (!user) throw new UnauthorizedException();
    const ok = await bcrypt.compare(body.password, user.password);
    if (!ok) throw new UnauthorizedException();
    return this.authService.login(user);
  }
}
