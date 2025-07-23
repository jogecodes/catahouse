import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files/folders to delete before building
const filesToDelete = [
  '../index.html',
  '../assets'
];

console.log('🧹 Cleaning old build files...');

filesToDelete.forEach(file => {
  const filePath = path.resolve(__dirname, file);
  if (fs.existsSync(filePath)) {
    if (fs.lstatSync(filePath).isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
      console.log(`✅ Deleted directory: ${file}`);
    } else {
      fs.unlinkSync(filePath);
      console.log(`✅ Deleted file: ${file}`);
    }
  }
});

console.log('✨ Clean build ready!'); 