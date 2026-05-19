const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function check() {
  const companies = await prisma.company.findMany();
  console.log('Migrated Companies:', companies.map(c => c.name));
  
  const projects = await prisma.project.findMany();
  console.log('Migrated Projects:', projects.length);
  
  const users = await prisma.user.findMany();
  console.log('Migrated Users:', users.length);
  
  await prisma.$disconnect();
}

check();
