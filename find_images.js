const fs = require('fs');
const path = require('path');

function walk(dir, results = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        walk(fullPath, results);
      }
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('Image') && content.includes('fill')) {
          results.push(fullPath);
        }
      }
    }
  }
  return results;
}

const images = walk('.');
console.log(JSON.stringify(images, null, 2));
