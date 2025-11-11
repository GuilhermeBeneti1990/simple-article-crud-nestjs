import { Injectable, NotFoundException } from '@nestjs/common';
import { AppDataSource } from '../data-source';
import { User } from '../entities/user.entity';
import { Permission } from '../entities/permission.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private repo = AppDataSource.getRepository(User);
  private permRepo = AppDataSource.getRepository(Permission);

  async create(data: {name:string,email:string,password:string,permissionName?:string}) {
    const { name, email, password, permissionName } = data;
    const exists = await this.repo.findOneBy({ email });
    if (exists) throw new Error('User already exists');
    const hash = await bcrypt.hash(password, 10);
    const permission = permissionName
      ? await this.permRepo.findOneBy({ name: permissionName })
      : await this.permRepo.findOneBy({ name: 'READER' });
    const user = this.repo.create({ name, email, password: hash, permission });
    return this.repo.save(user);
  }

  async findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException();
    return user;
  }

  async update(id: string, payload: Partial<User>) {
    const user = await this.findOne(id);
    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }
    Object.assign(user, payload);
    return this.repo.save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    return this.repo.remove(user);
  }

  async findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }
}
