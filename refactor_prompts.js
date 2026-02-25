const fs = require('fs');
const path = require('path');

const libDir = path.join(__dirname, 'lib');
const appDir = path.join(__dirname, 'app');
const hooksDir = path.join(__dirname, 'hooks');
const compsDir = path.join(__dirname, 'components');

const enginePath = path.join(libDir, 'prompt-engine.ts');
const utilsPath = path.join(libDir, 'prompt-utils.ts');
const coverPath = path.join(libDir, 'cover-letter-prompt.ts');
const promptsPath = path.join(libDir, 'prompts.ts');

// 1. Combine Files
const engineContent = fs.existsSync(enginePath) ? fs.readFileSync(enginePath, 'utf-8') : '';
const utilsContent = fs.existsSync(utilsPath) ? fs.readFileSync(utilsPath, 'utf-8') : '';
const coverContent = fs.existsSync(coverPath) ? fs.readFileSync(coverPath, 'utf-8') : '';

if (!engineContent && !utilsContent && !coverContent) {
  console.log("Already refactored.");
  process.exit(0);
}

// Strip imports from each to manually add at the top
const stripImports = (text) => text.replace(/^import\s+.*?;?\r?\n+/gm, '');

const finalContent = `import { JobDescriptionData, ResumeData } from "@/lib/schema";
import { scoreResume } from "@/lib/ats-scorer";

${stripImports(engineContent)}

${stripImports(utilsContent)}

${stripImports(coverContent)}
`;

fs.writeFileSync(promptsPath, finalContent);
console.log('Created lib/prompts.ts');

// 2. Remove old files
if(fs.existsSync(enginePath)) fs.unlinkSync(enginePath);
if(fs.existsSync(utilsPath)) fs.unlinkSync(utilsPath);
if(fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
console.log('Removed old prompt files.');

// 3. Update all imports
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
      
      extContent = extContent.replace(/from ["']@?\/lib\/prompt-engine["']/g, 'from "@/lib/prompts"');
      extContent = extContent.replace(/from ["']@?\/lib\/prompt-utils["']/g, 'from "@/lib/prompts"');
      extContent = extContent.replace(/from ["']@?\/lib\/cover-letter-prompt["']/g, 'from "@/lib/prompts"');
      
      extContent = extContent.replace(/from ["']\.\/prompt-engine["']/g, 'from "./prompts"');
      extContent = extContent.replace(/from ["']\.\/prompt-utils["']/g, 'from "./prompts"');
      extContent = extContent.replace(/from ["']\.\/cover-letter-prompt["']/g, 'from "./prompts"');

      // Edge Case: cover letter prompt has types that might be imported directly
      extContent = extContent.replace(/CoverLetterTone,?\s*/g, 'CoverLetterTone, ');
      extContent = extContent.replace(/CoverLetterLength,?\s*/g, 'CoverLetterLength, ');

      if (extContent !== original) {
        fs.writeFileSync(fullPath, extContent);
        console.log("Updated imports in " + fullPath);
      }
    }
  }
}

replaceInFiles(libDir);
replaceInFiles(appDir);
replaceInFiles(hooksDir);
replaceInFiles(compsDir);

console.log('Refactoring complete.');
