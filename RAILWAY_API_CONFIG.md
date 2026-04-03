# Configuração de API para Railway

## ✅ Como Funciona em Produção

### Problema Original
- Frontend React rodava em `localhost:3000` (proxy do Vite)
- Em produção no Railway, Vite não roda
- Requisições da API eram para `http://localhost:3000` (não existia)
- Erro: "Erro de Sincronização"

### Solução
O Express (Node.js backend) agora **serve o frontend React e roteia as requisições da API** na mesma porta:

```
Frontend React (está em /frontend-react/dist/)
    ↓
Express Na Port 3000
    ├─ GET / → Serve index.html (SPA)
    ├─ GET /funcionarios → Roteia para rota da API ✅
    ├─ GET /api/status → Roteia para rota da API ✅
    ├─ GET /assets/* → Serve arquivos estáticos ✅
    └─ GET /qualquer-outra-rota → Serve index.html (SPA) ✅
```

## 🔧 Configurações Necessárias no Railway

### 1. **Variáveis de Ambiente**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:port/database
```

### 2. **Nenhuma outra configuração necessária!**
- ✅ Railway detecta automaticamente o Dockerfile
- ✅ Build compila frontend React
- ✅ Express serve frontend + API
- ✅ Database URL já deve estar configurada

## 🧪 Como Testar Localmente

### Em Desenvolvimento (Com Vite)
```bash
cd frontend-react
npm run dev
# Acessa: http://localhost:5173
# Proxy do Vite roteia /funcionarios para http://localhost:3000
```

### Em Produção (Como Railway)
```bash
cd frontend-react
npm run build
cd ..
npm start
# Acessa: http://localhost:3000
# Express serve frontend + API
```

## 🔍 Verificar Conexão da API

### 1. **Verificar Health Check**
```bash
# Em Railway
curl https://seu-app.railway.app/health

# Esperado: 
# {"status":"ok","timestamp":"2026-04-03T..."}
```

### 2. **Verificar Status da API**
```bash
curl https://seu-app.railway.app/api/status

# Esperado:
# {
#   "status": "ok",
#   "environment": "production",
#   "uptime": 153.42,
#   "frontend": {
#     "distExists": true,
#     "indexExists": true
#   }
# }
```

### 3. **Debug Status do Build**
```bash
curl https://seu-app.railway.app/debug/build-status

# Mostra se frontend foi buildado corretamente
```

## 🐛 Troubleshooting

### Se receber "Erro de Sincronização"

**1. Verificar se DATABASE_URL está configurada:**
```bash
# No Railway Dashboard → Settings → Variables
# Deve ter DATABASE_URL preenchido
```

**2. Ver logs do Railway:**
- Railway Dashboard → Deployments → Logs
- Procure por mensagens de erro

**3. Testar conectividade com banco:**
```bash
curl https://seu-app.railway.app/api/status
```

### Se receber "Frontend não disponível"
- Verifique se /debug/build-status retorna `distExists: true`
- Se `distExists: false`, frontned não foi buildado
- Trigre redeploy: `git commit --allow-empty -m 'chore: retrigger' && git push`

## 📚 Arquivos Modificados

- `vite.config.js` - Melhorado com proxy mais robusto
- `frontend-react/src/config/api.js` - Novo: configuração de API para prod/dev
- `backend/src/app.js` - Express serve frontend + API

## ✅ Checklist para Debug

- [ ] `/health` retorna 200
- [ ] `/api/status` retorna 200 e mostra `distExists: true`
- [ ] `/debug/build-status` mostra `distExists: true`
- [ ] DATABASE_URL está configurada no Railway
- [ ] Dados sensíveis (credenciais) não estão em `.env` commitado
- [ ] Frontend carrega (não mostra erro "API rodando...")
- [ ] Requisições de API funcionam no console do navegador

## 🚀 Deploy Checklist

- [ ] Todos os commits foram feitos e pusheados
- [ ] Dockerfile está correto
- [ ] `postinstall` em package.json rodou com sucesso
- [ ] Frontend React foi buildado (dist/ criado)
- [ ] Railway fez rebuild após push automático
- [ ] Aplicação está online (não mostra 502 ou 503)
- [ ] `/health` retorna OK
- [ ] Dados carregam no dashboard
