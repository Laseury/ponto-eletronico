const prisma = require('../backend/db/prisma');

async function check() {
  const f = await prisma.funcionario.findFirst({
    where: { tipo: 'Horista Noturno' }
  });
  if (f) {
    console.log(`Funcionario: ${f.nome}`);
    console.log(`Tipo: ${f.tipo}`);
    console.log(`Carga Diaria: ${f.cargaHorariaDiaria}`);
  } else {
    console.log('Nenhum Horista Noturno encontrado.');
  }
}

check().finally(() => prisma.$disconnect());
