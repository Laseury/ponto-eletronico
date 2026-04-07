-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "login" VARCHAR(50) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "perfil" VARCHAR(20) NOT NULL DEFAULT 'Funcionario',
    "funcionario_id" INTEGER,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_login_key" ON "usuarios"("login");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_funcionario_id_key" ON "usuarios"("funcionario_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
