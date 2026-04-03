#!/usr/bin/env node
/**
 * Build script para compilar frontend React
 * Executado durante npm install
 */

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

const frontendDir = path.join(__dirname, 'frontend-react');

console.log('📦 Iniciando build do frontend React...');

try {
    // Navegar para frontend-react
    process.chdir(frontendDir);
    console.log(`📍 Diretório: ${process.cwd()}`);

    // Instalar dependências do frontend
    console.log('📥 Instalando dependências do frontend...');
    execSync('npm ci', { stdio: 'inherit' });

    // Fazer build com Vite
    console.log('🔨 Compilando React com Vite...');
    execSync('npm run build', { stdio: 'inherit' });

    // Voltar para raiz
    process.chdir(__dirname);

    // Verificar se dist foi criado
    const distPath = path.join(frontendDir, 'dist');
    if (fs.existsSync(distPath)) {
        console.log(`✅ Frontend buildado com sucesso em: ${distPath}`);
    } else {
        throw new Error('Diretório dist não foi criado após build');
    }
} catch (error) {
    console.error('❌ Erro ao fazer build do frontend:', error.message);
    process.exit(1);
}
