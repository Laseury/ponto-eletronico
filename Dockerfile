# Dockerfile otimizado para Railway
FROM node:20-alpine

WORKDIR /app

# Copiar apenas package files primeiro (melhor cache)
COPY package*.json ./
COPY build-frontend.js ./

# Copiar todo o frontend-react (incluindo vite.config.js, index.html, src/)
COPY frontend-react ./frontend-react

# Instalar dependências do backend
RUN npm ci --omit=dev

# Executar build do frontend (que também instala suas dependências)
RUN node build-frontend.js

# Copiar resto da aplicação
COPY . .

# Gerar Prisma client
RUN npm run prisma:generate

# Exposar porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Iniciar aplicação
CMD ["npm", "start"]
