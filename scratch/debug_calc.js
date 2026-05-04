const prisma = require('../backend/db/prisma');

async function debug() {
  const fId = 1; // Assuming employee 1
  const mes = 5;
  const ano = 2026;

  const regs = await prisma.registroPonto.findMany({
    where: {
      funcionarioId: fId,
      data: {
        gte: new Date(ano, mes - 1, 1),
        lte: new Date(ano, mes - 1, 31)
      }
    },
    orderBy: { data: 'asc' }
  });

  let totalMin = 0;
  let countDias = 0;
  let countFeriados = 0;

  regs.forEach(r => {
    if (r.total) {
      const [h, m] = r.total.split(':').map(Number);
      totalMin += (h * 60) + m;
      countDias++;
    }
    if (r.evento === 'Feriado') countFeriados++;
  });

  console.log(`Total Minutos: ${totalMin} (${Math.floor(totalMin/60)}:${totalMin%60})`);
  console.log(`Dias com 'total': ${countDias}`);
  console.log(`Feriados: ${countFeriados}`);
}

debug().finally(() => prisma.$disconnect());
