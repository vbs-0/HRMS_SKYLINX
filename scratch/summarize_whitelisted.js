const fs = require('fs');
const path = require('path');

const gapData = JSON.parse(fs.readFileSync(path.join(__dirname, 'gap_analysis_details.json'), 'utf-8'));
const fns = gapData.whitelistedFns;

const grouped = {};
for (const fn of fns) {
  const fileKey = fn.file;
  if (!grouped[fileKey]) {
    grouped[fileKey] = [];
  }
  grouped[fileKey].push({ name: fn.name, signature: fn.signature });
}

console.log('--- WHITELISTED FUNCTIONS BY FILE ---');
for (const [file, items] of Object.entries(grouped)) {
  console.log(`\nFile: ${file} (${items.length} functions)`);
  items.forEach(item => {
    console.log(`  - ${item.name}(${item.signature})`);
  });
}
