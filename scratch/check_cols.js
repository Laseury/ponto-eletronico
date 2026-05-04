const prisma = require('../backend/db/prisma');

async function checkCols() {
  try {
    const cols = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'funcionarios'
    `;
    console.log("Colunas encontradas na tabela 'funcionarios':");
    console.log(cols.map(c => c.column_name));
  } catch (err) {
    console.error("Erro ao verificar colunas:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkCols();
