const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', '..', 'docs', 'api', 'openapi.yaml');
const dst = path.join(__dirname, '..', 'openapi.yaml');

if (!fs.existsSync(src)) {
  console.error('❌ docs/api/openapi.yaml não encontrado em', src);
  process.exit(1);
}

fs.copyFileSync(src, dst);
console.log(`✅ openapi.yaml sincronizado (${fs.statSync(dst).size} bytes)`);