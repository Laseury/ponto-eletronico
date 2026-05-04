const prisma = require('../backend/db/prisma');

async function list() {
  const fs = await prisma.funcionario.findMany();
  fs.forEach(f => {
    console.log(`ID: ${f.id} | Nome: ${f.nome} | Tipo: '${f.tipo}' | Carga: ${f.cargaHorariaDiaria}`);
  });
}

list().finally(() => prisma.$disconnect());
