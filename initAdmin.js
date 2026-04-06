require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function initAdmin() {
  try {
    const adminExists = await prisma.usuario.findFirst({
        where: { perfil: 'Admin' }
    });

    if (adminExists) {
        console.log("Admin já inicializado.");
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    await prisma.usuario.create({
        data: {
            nome: "Administrador Sistema",
            login: "admin",
            senha: hashedPassword,
            perfil: "Admin"
        }
    });

    console.log("Admin padrão criado com sucesso (admin / admin123)");
  } catch(err) {
    console.error("Erro", err);
  } finally {
    await prisma.$disconnect();
  }
}

initAdmin();
