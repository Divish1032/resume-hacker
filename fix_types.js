const fs = require('fs');
const path = require('path');

const dirs = ['lib', 'app', 'hooks', 'components'].map(d => path.join(__dirname, d));

function replaceInFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInFiles(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let extContent = fs.readFileSync(fullPath, 'utf-8');
      
      const original = extContent;
      
      extContent = extContent.replace(/CoverLetterTone,\s*/g, 'CoverLetterTone');
      extContent = extContent.replace(/CoverLetterLength,\s*/g, 'CoverLetterLength');
      extContent = extContent.replace(/CoverLetterTone;/g, 'CoverLetterTone;');
      extContent = extContent.replace(/CoverLetterLength;/g, 'CoverLetterLength;');

      if (extContent !== original) {
        fs.writeFileSync(fullPath, extContent);
        console.log("Fixed types in " + fullPath);
      }
    }
  }
}

dirs.forEach(replaceInFiles);
console.log('Fix complete.');
