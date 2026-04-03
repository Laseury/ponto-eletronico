#!/usr/bin/env node
/**
 * Build script para compilar frontend React
 * Executado durante npm install
 */

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

const rootDir = __dirname;
const frontendDir = path.join(rootDir, 'frontend-react');
const distDir = path.join(frontendDir, 'dist');
const indexPath = path.join(distDir, 'index.html');

console.log('\n========================================');
console.log('🚀 BUILD DO FRONTEND REACT');
console.log('========================================\n');

console.log(`📍 Root directory: ${rootDir}`);
console.log(`📍 Frontend directory: ${frontendDir}`);
console.log(`📍 Dist output: ${distDir}\n`);

try {
    // Verificar se frontend-react existe
    if (!fs.existsSync(frontendDir)) {
        throw new Error(`Diretório frontend-react não encontrado em ${frontendDir}`);
    }
    console.log('✓ frontend-react encontrado');

    // Navegar para frontend-react
    process.chdir(frontendDir);
    console.log(`✓ Diretório mudado para: ${process.cwd()}`);

    // Instalar dependências do frontend
    console.log('\n📥 Instalando dependências do frontend...');
    try {
        execSync('npm ci', { stdio: 'inherit' });
        console.log('✓ Dependências instaladas');
    } catch (error) {
        console.warn('⚠ npm ci falhou, tentando npm install...');
        execSync('npm install', { stdio: 'inherit' });
        console.log('✓ npm install completado');
    }

    // Fazer build com Vite
    console.log('\n🔨 Compilando React com Vite...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✓ Build concluído');

    // Voltar para raiz
    process.chdir(rootDir);
    console.log(`✓ Diretório mudado de volta para: ${process.cwd()}`);

    // Verificar se dist foi criado
    if (!fs.existsSync(distDir)) {
        throw new Error(`Diretório dist não foi criado após build. Procurava em: ${distDir}`);
    }
    console.log(`✓ Diretório dist encontrado`);

    // Verificar se index.html existe
    if (!fs.existsSync(indexPath)) {
        throw new Error(`index.html não foi encontrado em ${indexPath}`);
    }
    console.log(`✓ index.html encontrado`);

    // Listar conteúdo do dist
    const files = fs.readdirSync(distDir);
    console.log(`\n📦 Conteúdo do dist (${files.length} itens):`);
    files.forEach(file => {
        const filePath = path.join(distDir, file);
        const isDir = fs.statSync(filePath).isDirectory();
        console.log(`   ${isDir ? '📁' : '📄'} ${file}`);
    });

    console.log('\n✅ BUILD DO FRONTEND CONCLUÍDO COM SUCESSO!\n');
    console.log('========================================\n');

    process.exit(0);
} catch (error) {
    console.error('\n❌ ERRO AO FAZER BUILD DO FRONTEND:');
    console.error(`   ${error.message}\n`);
    
    if (error.stdout) {
        console.error('STDOUT:', error.stdout.toString());
    }
    if (error.stderr) {
        console.error('STDERR:', error.stderr.toString());
    }
    
    console.error('\n========================================\n');
    process.exit(1);
}
