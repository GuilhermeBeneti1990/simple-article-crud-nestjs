import { Injectable, NotFoundException } from '@nestjs/common';
import { AppDataSource } from '../data-source';
import { Article } from '../entities/article.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class ArticlesService {
  private repo = AppDataSource.getRepository(Article);
  private userRepo = AppDataSource.getRepository(User);

  async create(payload: {title:string, content:string, userId:string}) {
    const user = await this.userRepo.findOneBy({ id: payload.userId });
    if (!user) throw new NotFoundException('Author not found');
    const art = this.repo.create({ title: payload.title, content: payload.content, author: user });
    return this.repo.save(art);
  }

  async findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    const a = await this.repo.findOneBy({ id });
    if (!a) throw new NotFoundException();
    return a;
  }

  async update(id:string, payload: Partial<Article>) {
    const art = await this.findOne(id);
    Object.assign(art, payload);
    return this.repo.save(art);
  }

  async remove(id:string) {
    const art = await this.findOne(id);
    return this.repo.remove(art);
  }
}
