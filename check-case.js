const fs = require('fs');
const path = require('path');

function checkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') checkDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const importRegex = /from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith('.')) {
          const resolvedDir = path.dirname(fullPath);
          let targetPath = path.join(resolvedDir, importPath);
          
          // Basic check if file exists with exact case
          // This is a naive check just to see if fs.existsSync works, but Windows is case-insensitive.
          // To truly check case on Windows, we need to read the parent directory and find the exact file name.
          const targetDir = path.dirname(targetPath);
          const targetBase = path.basename(targetPath);
          
          if (fs.existsSync(targetDir)) {
            const actualFiles = fs.readdirSync(targetDir);
            // Check for .ts, .tsx, .js
            const possibleNames = [targetBase, targetBase + '.ts', targetBase + '.tsx', targetBase + '.js'];
            let found = false;
            for (const actual of actualFiles) {
              if (possibleNames.includes(actual)) {
                found = true;
                break;
              }
            }
            if (!found) {
              // Try to see if it's an index file
              const asDir = path.join(targetDir, targetBase);
              if (fs.existsSync(asDir) && fs.statSync(asDir).isDirectory()) {
                const dirFiles = fs.readdirSync(asDir);
                if (dirFiles.includes('index.ts') || dirFiles.includes('index.tsx')) {
                  found = true;
                }
              }
            }
            
            if (!found && fs.existsSync(targetPath)) {
              // It exists but wasn't found in actualFiles with exact casing!
              console.log(`CASE MISMATCH: ${fullPath} imports ${importPath}`);
            }
          }
        }
      }
    }
  }
}

checkDir(path.join(__dirname, 'frontend', 'src'));
checkDir(path.join(__dirname, 'backend', 'src'));
console.log('Check complete.');
