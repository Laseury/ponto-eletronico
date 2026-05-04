const prisma = require('../backend/db/prisma');

async function run() {
  const fs = await prisma.funcionario.findMany();
  console.log('Total Funcionarios:', fs.length);
  const types = [...new Set(fs.map(f => f.tipo))];
  console.log('Types:', types);
}

run().finally(() => prisma.$disconnect());
