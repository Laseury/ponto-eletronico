const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'js', 'funcionario.js');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n([\s\S]*?)>>>>>>> 75cfb01766022b8807f71f98690dae191c66f473\r?\n?/g;

// Keep the HEAD section (group 1)
content = content.replace(regex, '$1');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Merge conflicts resolved successfully by keeping HEAD.');
