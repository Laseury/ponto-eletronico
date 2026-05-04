const prisma = require('../backend/db/prisma');

async function count() {
  const c = await prisma.registroPonto.count();
  const f = await prisma.funcionario.count();
  console.log(`Funcionarios: ${f}`);
  console.log(`Registros: ${c}`);
}

count().finally(() => prisma.$disconnect());
