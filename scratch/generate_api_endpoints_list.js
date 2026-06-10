const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, '..', 'apps', 'api', 'src', 'modules');

function scanControllers(dir) {
  const results = {};
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const subFiles = fs.readdirSync(filePath);
      const controllerFile = subFiles.find(f => f.endsWith('.controller.ts'));
      if (controllerFile) {
        const controllerPath = path.join(filePath, controllerFile);
        results[file] = parseController(controllerPath);
      }
    }
  }
  return results;
}

function parseController(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const endpoints = [];
  
  // Find class level controller prefix
  let controllerPrefix = '';
  const controllerClassMatch = content.match(/@Controller\((['"`])(.*?)\1\)/);
  if (controllerClassMatch) {
    controllerPrefix = controllerClassMatch[2];
  }

  let currentPermission = 'None';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for permission decorator
    const permMatch = line.match(/@RequirePermissions\((['"`])(.*?)\1\)/);
    if (permMatch) {
      currentPermission = permMatch[2];
    }

    // Check for HTTP methods
    const methodMatch = line.match(/@(Get|Post|Patch|Put|Delete)\((?:(['"`])(.*?)\2)?\)/);
    if (methodMatch) {
      const httpMethod = methodMatch[1];
      const routePath = methodMatch[3] || '';
      
      // Find method name on subsequent lines
      let methodName = '';
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j].trim();
        const nameMatch = nextLine.match(/^([a-zA-Z0-9_]+)\s*\(/);
        if (nameMatch) {
          methodName = nameMatch[1];
          break;
        }
      }

      const fullPath = '/' + [controllerPrefix, routePath].filter(Boolean).join('/').replace(/\/+/g, '/');
      endpoints.push({
        method: httpMethod,
        route: fullPath,
        handler: methodName,
        permission: currentPermission
      });
      // reset permission for next method
      currentPermission = 'None';
    }
  }

  return {
    prefix: controllerPrefix,
    file: path.basename(filePath),
    endpoints
  };
}

const report = scanControllers(modulesDir);
fs.writeFileSync(path.join(__dirname, 'api_endpoints.json'), JSON.stringify(report, null, 2));
console.log('API Scan completed. Saved to scratch/api_endpoints.json');
