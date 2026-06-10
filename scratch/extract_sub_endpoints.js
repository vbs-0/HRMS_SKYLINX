const fs = require('fs');
const path = require('path');

const refRoot = path.join(__dirname, '..', '..', 'hrms-16.8.0');
const apiFiles = [
  path.join(refRoot, 'hrms', 'api', '__init__.py'),
  path.join(refRoot, 'hrms', 'api', 'roster.py'),
  path.join(refRoot, 'hrms', 'api', 'oauth.py'),
  path.join(refRoot, 'hrms', 'api', 'system_settings.py')
];

const results = {};

for (const filePath of apiFiles) {
  if (!fs.existsSync(filePath)) continue;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const fileKey = path.relative(refRoot, filePath);
  results[fileKey] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('@frappe.whitelist')) {
      let fnName = 'unknown';
      let fnSignature = '';
      let docstring = '';
      
      // Look forward for def
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine.startsWith('def ')) {
          const match = lines[j].match(/def\s+([a-zA-Z0-9_]+)\((.*?)\):/);
          if (match) {
            fnName = match[1];
            fnSignature = match[2];
          } else {
            fnName = nextLine;
          }
          
          // Try to capture docstring
          let docLines = [];
          let insideDoc = false;
          for (let k = j + 1; k < Math.min(j + 15, lines.length); k++) {
            const docLine = lines[k].trim();
            if (docLine.startsWith('"""') || docLine.startsWith("'''")) {
              if (insideDoc) {
                break;
              } else {
                insideDoc = true;
                continue;
              }
            }
            if (insideDoc) {
              docLines.push(docLine);
            } else if (docLine.startsWith('def ') || docLine.startsWith('@') || docLine === '') {
              // break if we hit next definition
              break;
            }
          }
          docstring = docLines.join(' ');
          break;
        }
      }
      
      results[fileKey].push({
        name: fnName,
        signature: fnSignature,
        purpose: docstring || 'Custom utility endpoint'
      });
    }
  }
}

fs.writeFileSync(path.join(__dirname, 'sub_endpoints.json'), JSON.stringify(results, null, 2));
console.log('Sub-endpoints scan completed. Saved to scratch/sub_endpoints.json');
