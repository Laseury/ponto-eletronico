# 📊 Estrutura do Banco com Prisma

## Desenvolvimento Local

### Primeira Vez (Setup Completo)
```bash
# 1. Instalar dependências
npm install

# 2. Criar/migrar banco de dados
npm run prisma:migrate

# 3. Popular com dados de teste (opcional)
npm run prisma:seed

# 4. Iniciar servidor
npm start
```

### Desenvolvimento Normal
```bash
npm run dev  # Inicia com nodemon (hot-reload)
```

### Visualizar Banco (Interface Gráfica)
```bash
npm run prisma:studio
```

---

## Production / Railway

### Primeiro Deploy
```bash
# Railway vai rodara automaticamente na sequence:
# 1. npm install
# 2. Suas migrações (se houver)
# 3. npm start
```

### Configuração no railway.json
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 5
  }
}
```

### Environment Variables no Railway
```
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
```

---

## 🗑️ Como Remover Dados de Teste Depois

### Opção 1: Limpar via Prisma Studio (Mais Fácil)
```bash
npm run prisma:studio
# Abre interface gráfica onde você pode deletar dados manualmente
```

### Opção 2: Deletar via Script (Para Produção)
Crie um arquivo `prisma/clean.js`:
```javascript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clean() {
  console.log("🧹 Limpando dados de teste...");
  
  // Deletar em ordem de dependência
  await prisma.logRegistro.deleteMany({});
  await prisma.registroPonto.deleteMany({});
  await prisma.funcionario.deleteMany({});
  
  console.log("✅ Dados removidos!");
  await prisma.$disconnect();
}

clean().catch(e => {
  console.error(e);
  process.exit(1);
});
```

Depois execute:
```bash
node prisma/clean.js
```

### Opção 3: Remover Seed do Build

**Para fazer com que o seed NÃO rode automaticamente no Railway:**

1. Remova ou comente as linhas no `seed.js` que deletam dados
2. Ou crie variável de ambiente:

```javascript
// No prisma/seed.js
if (process.env.SKIP_SEED === "true") {
  console.log("⏭️  Seed pulado (SKIP_SEED=true)");
  process.exit(0);
}
```

No Railway, adicione:
```
SKIP_SEED=true
```

---

## 📁 Arquivos Importantes

| Arquivo | Função |
|--------|--------|
| `prisma/schema.prisma` | Define estrutura do banco |
| `prisma/seed.js` | Dados de teste |
| `.prismarc.json` | Configuração do seed automático |
| `.env` | Variáveis de ambiente (local) |
| `prisma/migrations/` | Histórico de migrações |

---

## 🚀 Workflow Recomendado

### Desenvolvimento
```bash
npm run prisma:migrate  # Criar migração quando mudar schema
npm run dev             # Iniciar servidor
npm run prisma:studio   # Visualizar/editar dados
```

### Antes de Ir Para Production
```bash
# Reset banco local e testar
npm run prisma:migrate:reset  # Reset completo (delete + migrate + seed)

# Ou manualmente:
npm run prisma:seed   # Re-popular dados
npm start             # Testar servidor
```

### Production (Railway)
- Railway detecta `package.json` e instala dependências
- Roda `npm run prisma:migrate` automaticamente
- Inicia com `npm start`
- Seed roda uma única vez na primeira migration

---

## ⚠️ Notas Importantes

1. **Seed rodará uma vez** - Use `upsert` (como já está) para evitar duplicatas
2. **Para resetar tudo** - Use: `npx prisma migrate reset`
3. **Backup antes de deletar** - Sempre faça backup antes de limpar production
4. **Migrações são versionadas** - Cada mudança no schema cria uma migração
