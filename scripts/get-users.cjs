const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const p = new PrismaClient();
p.user.findMany().then(u => { 
  console.log(JSON.stringify(u, null, 2)); 
  process.exit(0); 
});
