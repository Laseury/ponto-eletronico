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
const htmlPath = path.join(frontendDir, 'index.html');

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

    // Verificar se index.html existe
    if (!fs.existsSync(htmlPath)) {
        throw new Error(`index.html não encontrado em ${htmlPath}`);
    }
    console.log('✓ index.html encontrado');

    // Verificar se vite.config.js existe
    const viteConfigPath = path.join(frontendDir, 'vite.config.js');
    if (!fs.existsSync(viteConfigPath)) {
        throw new Error(`vite.config.js não encontrado em ${viteConfigPath}`);
    }
    console.log('✓ vite.config.js encontrado');

    // Navegar para frontend-react
    process.chdir(frontendDir);
    console.log(`✓ Diretório mudado para: ${process.cwd()}`);

    // Verificar se node_modules existe
    if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
        console.log('\n📥 Instalando dependências do frontend...');
        try {
            // IMPORTANTE: NÃO usar --omit=dev porque precisamos de vite, @vitejs/plugin-react, etc
            execSync('npm ci', { stdio: 'inherit' });
            console.log('✓ Dependências instaladas (npm ci)');
        } catch (error) {
            console.warn('⚠ npm ci falhou, tentando npm install...');
            execSync('npm install', { stdio: 'inherit' });
            console.log('✓ npm install completado');
        }
    } else {
        console.log('✓ node_modules já existe');
    }

    // Fazer build com Vite
    console.log('\n🔨 Compilando React com Vite...');
    console.log(`   Usando index.html: ${htmlPath}`);
    console.log(`   Usando vite.config.js: ${viteConfigPath}\n`);
    
    execSync('npm run build', { stdio: 'inherit' });
    console.log('\n✓ Build concluído');

    // Voltar para raiz
    process.chdir(rootDir);
    console.log(`✓ Diretório mudado de volta para: ${process.cwd()}`);

    // Verificar se dist foi criado
    if (!fs.existsSync(distDir)) {
        throw new Error(`Diretório dist não foi criado após build. Procurava em: ${distDir}`);
    }
    console.log(`✓ Diretório dist encontrado`);

    // Verificar se index.html existe no dist
    if (!fs.existsSync(indexPath)) {
        throw new Error(`index.html não foi criado no dist. Procurava em: ${indexPath}`);
    }
    console.log(`✓ dist/index.html encontrado`);

    // Listar conteúdo do dist
    const files = fs.readdirSync(distDir);
    console.log(`\n📦 Conteúdo do dist (${files.length} itens):`);
    files.forEach(file => {
        const filePath = path.join(distDir, file);
        const isDir = fs.statSync(filePath).isDirectory();
        const size = isDir ? '' : ` (${fs.statSync(filePath).size} bytes)`;
        console.log(`   ${isDir ? '📁' : '📄'} ${file}${size}`);
    });

    console.log('\n✅ BUILD DO FRONTEND CONCLUÍDO COM SUCESSO!\n');
    console.log('========================================\n');

    process.exit(0);
} catch (error) {
    console.error('\n❌ ERRO AO FAZER BUILD DO FRONTEND:');
    console.error(`   ${error.message}\n`);
    
    // Tentar fornecer contexto útil
    if (error.message.includes('Cannot resolve entry')) {
        console.error('💡 DICA: Verifique se index.html existe no diretório frontend-react');
    }
    
    if (error.stdout) {
        console.error('STDOUT:', error.stdout.toString());
    }
    if (error.stderr) {
        console.error('STDERR:', error.stderr.toString());
    }
    
    console.error('\n========================================\n');
    process.exit(1);
}
