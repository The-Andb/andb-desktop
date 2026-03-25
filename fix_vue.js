const fs = require('fs');
const compiler = require('vue/compiler-sfc');
const file = fs.readFileSync('src/views/Settings.vue', 'utf-8');
const { errors } = compiler.parse(file);
if (errors.length > 0) {
  errors.forEach(e => {
    console.error(`Error at line ${e.loc.start.line}, col ${e.loc.start.column}: ${e.message}`);
  });
} else {
  console.log('No vue template errors! It is PERFECTLY valid.');
}
