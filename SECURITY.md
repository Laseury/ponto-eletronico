# Segurança - Proteção de Credenciais

## ✅ Status Atual

- ✓ `.env` está em `.gitignore` (não será commitado)
- ✓ `.env.example` está no repositório (template para outros)
- ✓ Nenhuma credencial no histórico do Git

## 📋 Checklist de Segurança

### Proteger Credenciais Localmente

1. **Nunca committe seus arquivos:**
   ```bash
   .env                    # Arquivo de desenvolvimento (IGNORE)
   .env.local             # Arquivo local pessoal (IGNORE)
   *.key                  # Chaves privadas (IGNORE)
   *.pem                  # Certificados (IGNORE)
   ```

2. **Use apenas as seguintes formas de configuração:**
   - ✓ Variáveis de ambiente (recomendado)
   - ✓ `.env.local` (apenas local, nunca no git)
   - ✓ Secret Manager do seu servidor (produção)

### Em Produção (Railway)

1. **Configure via Dashboard do Railway:**
   - Variables → `DATABASE_URL`
   - Variables → `NODE_ENV=production`
   - Nunca passe por `.env` em produção

2. **Teste a segurança:**
   ```bash
   # Verifique se .env está ignorado
   git check-ignore .env
   # Deve retornar: .env

   # Verifique nenhuma credential no git
   git grep "password\|secret\|token\|key" -- '*.js' '*.ts' '*.json'
   ```

## ⚠️ Se Credenciais Foram Expostas

Se acidentalmente commitou credenciais, execute:

```bash
# Remover de todo histórico (CUIDADO - Reescreve histórico)
git filter-branch --tree-filter 'rm -f .env' -- --all

# Ou use o bfg (mais simples):
bfg --delete-files .env

# Depois force push
git push origin --force --all
```

## 🔐 Melhores Práticas

1. **Nunca hardcode credenciais:**
   ```javascript
   // ❌ ERRADO
   const PASSWORD = "Sifra10*";
   
   // ✅ CORRETO
   const PASSWORD = process.env.PASSWORD;
   ```

2. **Use variáveis de ambiente:**
   ```javascript
   // Verificar se está configurado
   if (!process.env.DATABASE_URL) {
       throw new Error("DATABASE_URL não configurada!");
   }
   ```

3. **Rotação de credenciais:**
   - Mude senhas regularmente
   - Se expor acidentalmente, mude imediatamente
   - Use senhas fortes (mínimo 16 caracteres)

## 📚 Referências

- [OWASP: Secure Coding](https://owasp.org/www-project-secure-coding/)
- [Railway: Managing Secrets](https://docs.railway.app/develop/variables)
- [Node.js: dotenv](https://github.com/motdotla/dotenv)
