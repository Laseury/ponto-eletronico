# Prisma Setup Guide

## Instalação

```bash
npm install
```

## Configuração

1. Configure a variável de ambiente `DATABASE_URL` no arquivo `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/ponto_eletronico"
```

2. Execute as migrações do Prisma:

```bash
npm run prisma:migrate
```

ou com nome customizado:

```bash
npx prisma migrate dev --name init
```

## Scripts Disponíveis

```bash
# Criar/atualizar banco de dados com migrações
npm run prisma:migrate

# Abrir Prisma Studio (interface visual do banco)
npm run prisma:studio

# Inicializar banco com dados de exemplo
npm run init:db

# Iniciar servidor (executa init:db automaticamente)
npm start

# Modo desenvolvimento com hot-reload
npm run dev
```

## Estrutura do Schema

O arquivo `prisma/schema.prisma` define três modelos:

### 1. **Funcionario**
- Armazena informações dos funcionários
- Campos: nome, tipo (Mensalista/Horista/Horista Noturno), ativo
- Relacionamentos: registrosPonto, logs

### 2. **RegistroPonto**
- Registros diários de entrada/saída
- Campos: horários (e1-s3), cálculos (total, extras, negativos, noturno)
- Suporta eventos: Férias, Atestado, Feriado, Falta, Folga Banco, DSR

### 3. **LogRegistro**
- Rastreamento de alterações
- Campos: acao (criacao/edicao), campos alterados, valores anterior/novo

## Primeiros Passos

```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env com DATABASE_URL

# 3. Criar banco e executar migrações
npm run prisma:migrate

# 4. Inicializar com dados de exemplo
npm run init:db

# 5. Iniciar servidor
npm start
```

## Usar Prisma nos Controllers

```javascript
const prisma = require("../db/prisma");

// Exemplo: buscar todos os funcionários
async function listarFuncionarios(req, res) {
  try {
    const funcionarios = await prisma.funcionario.findMany({
      where: { ativo: true },
      include: { registrosPonto: true },
    });
    res.json(funcionarios);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}
```

## Documentação

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Provider](https://www.prisma.io/docs/reference/database-reference/connection-urls#postgresql)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
