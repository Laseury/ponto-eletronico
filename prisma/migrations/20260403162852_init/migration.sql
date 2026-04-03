-- CreateTable
CREATE TABLE "funcionarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "extras" VARCHAR(10) DEFAULT '00:00',
    "faltas" INTEGER DEFAULT 0,
    "ativo" BOOLEAN DEFAULT true,

    CONSTRAINT "funcionarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_registros" (
    "id" SERIAL NOT NULL,
    "funcionario_id" INTEGER NOT NULL,
    "data_registro" DATE NOT NULL,
    "usuario" VARCHAR(50) NOT NULL,
    "acao" VARCHAR(20) NOT NULL,
    "campo_alterado" VARCHAR(20),
    "valor_anterior" VARCHAR(20),
    "valor_novo" VARCHAR(20),
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_registros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_ponto" (
    "id" SERIAL NOT NULL,
    "funcionario_id" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "e1" TIME(6),
    "s1" TIME(6),
    "e2" TIME(6),
    "s2" TIME(6),
    "e3" TIME(6),
    "s3" TIME(6),
    "total" VARCHAR(10),
    "extras" VARCHAR(10),
    "negativos" VARCHAR(10),
    "evento" VARCHAR(20),
    "noturno" VARCHAR(10),

    CONSTRAINT "registros_ponto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registros_ponto_funcionario_id_data_key" ON "registros_ponto"("funcionario_id", "data");

-- AddForeignKey
ALTER TABLE "log_registros" ADD CONSTRAINT "log_registros_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registros_ponto" ADD CONSTRAINT "registros_ponto_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
