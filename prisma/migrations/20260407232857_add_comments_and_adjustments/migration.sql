-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "perfil" SET DEFAULT 'RH';

-- CreateTable
CREATE TABLE "comentarios" (
    "id" SERIAL NOT NULL,
    "texto" TEXT NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "data_referencia" DATE,
    "funcionario_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ajustes_saldo" (
    "id" SERIAL NOT NULL,
    "funcionario_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "valor" VARCHAR(10) NOT NULL,
    "motivo" VARCHAR(255) NOT NULL,
    "data" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ajustes_saldo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajustes_saldo" ADD CONSTRAINT "ajustes_saldo_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajustes_saldo" ADD CONSTRAINT "ajustes_saldo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
