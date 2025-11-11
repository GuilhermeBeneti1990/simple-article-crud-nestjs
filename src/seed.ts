import { AppDataSource } from './data-source';
import { Permission } from './entities/permission.entity';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

async function seed(){
  const dataSource = await AppDataSource.initialize();
  const permRepo = dataSource.getRepository(Permission);
  const userRepo = dataSource.getRepository(User);

  const perms = [
    { name: 'ADMIN', description: 'Admin: manage users and articles' },
    { name: 'EDITOR', description: 'Editor: manage articles' },
    { name: 'READER', description: 'Reader: only read articles' },
  ];
  for(const p of perms){
    const exist = await permRepo.findOneBy({ name: p.name });
    if(!exist){
      await permRepo.save(permRepo.create(p));
      console.log('Created permission', p.name);
    }
  }

  const rootEmail = process.env.ROOT_EMAIL || 'root@example.com';
  const rootPass = process.env.ROOT_PASSWORD || 'rootpass';
  let root = await userRepo.findOne({ where: { email: rootEmail }});
  if (!root){
    const adminPerm = await permRepo.findOneBy({ name: 'ADMIN' });
    const hashed = await bcrypt.hash(rootPass, 10);
    root = userRepo.create({ name: 'root', email: rootEmail, password: hashed, permission: adminPerm });
    await userRepo.save(root);
    console.log('Created root user', rootEmail);
  } else {
    console.log('Root already exists');
  }
  await dataSource.destroy();
}
seed().catch(err=>{ console.error('Seed error', err); process.exit(1); });
