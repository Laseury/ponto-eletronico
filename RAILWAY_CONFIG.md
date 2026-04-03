# Checklist de Configuração Railway

## ✓ Variáveis de Ambiente Obrigatórias

Configure estas variáveis no painel do Railway:

```
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database_name
PORT=3000
```

## ✓ Passos para Deploy

1. **Remova a configuração de porta antiga (3000 fixo)**
   - No Railway, remova cualquier configuração de "Port" se estiver definida manualmente
   - A aplicação agora detecta automaticamente (PORT env var)

2. **Configure a variável DATABASE_URL**
   - Deve apontar para seu banco PostgreSQL
   - Formato: `postgresql://username:password@host:port/dbname`

3. **Faça o deploy**
   - Commit das mudanças
   - Push para o repositório
   - Railway detectará automaticamente via Procfile

4. **Teste o health check**
   - Acesse: `https://seu-app.railway.app/health`
   - Deve retornar: `{"status":"ok","timestamp":"..."}`

## 🔍 Troubleshooting

Se ainda receber "Application failed to respond":

### 1. Verifique Connection String
```bash
echo $DATABASE_URL
```

### 2. Veja os logs completos
- Vá para Deployments → Logs
- Procure por: `Conexão com banco de dados OK`
- Se não aparecer, há problema com DATABASE_URL

### 3. Tente acessar /api/status
```
GET https://seu-app.railway.app/api/status
```

### 4. Se ainda not working
- Verifique se o banco está acessível do Railroad (firewall)
- Aumentou timeout? Tente novamente em 30-60 segundos
- Verifique se há migrations pendentes

## 📝 Arquivos alterados

- ✓ [Procfile](Procfile) - Adicionado
- ✓ [railway.toml](railway.toml) - Adicionado
- ✓ [backend/src/server.js](backend/src/server.js) - Melhorado
- ✓ [backend/src/app.js](backend/src/app.js) - Melhorado
- ✓ [.env.example](.env.example) - Atualizado
