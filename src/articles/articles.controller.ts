import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';

@Controller('articles')
export class ArticlesController {
  constructor(private articleService: ArticlesService) {}

  @Get()
  findAll() { return this.articleService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id:string) { return this.articleService.findOne(id); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('EDITOR','ADMIN')
  @Post()
  create(@Body() body:any, @Req() req:any) {
    return this.articleService.create({ title: body.title, content: body.content, userId: req.user.id });
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('EDITOR','ADMIN')
  @Put(':id')
  update(@Param('id') id:string, @Body() body:any) {
    return this.articleService.update(id, body);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('EDITOR','ADMIN')
  @Delete(':id')
  remove(@Param('id') id:string) {
    return this.articleService.remove(id);
  }
}
