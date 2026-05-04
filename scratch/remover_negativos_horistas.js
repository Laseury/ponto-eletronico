const prisma = require('../backend/db/prisma');

async function clearNegativos() {
  try {
    console.log("Iniciando limpeza de horas negativas para horistas...");

    const result = await prisma.registroPonto.updateMany({
      where: {
        funcionario: {
          tipo: {
            in: ['Horista', 'Horista Noturno']
          }
        },
        negativos: {
          not: '00:00'
        }
      },
      data: {
        negativos: '00:00'
      }
    });

    console.log(`Sucesso! ${result.count} registros foram atualizados.`);
  } catch (error) {
    console.error("Erro ao limpar negativos:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearNegativos();
