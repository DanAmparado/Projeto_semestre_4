const fs = require('fs');
const path = require('path');

const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '..');

const migrationsSrc = path.join(backendRoot, 'db', 'migrations');
const migrationsDst = path.join(repoRoot, 'supabase', 'migrations');
const seedSrc = path.join(backendRoot, 'db', 'seed.sql');
const seedDst = path.join(repoRoot, 'supabase', 'seed.sql');

if (!fs.existsSync(migrationsDst)) {
  fs.mkdirSync(migrationsDst, { recursive: true });
}

// Limpa migrations antigas no destino
for (const f of fs.readdirSync(migrationsDst)) {
  if (f.endsWith('.sql')) fs.unlinkSync(path.join(migrationsDst, f));
}

// Copia migrations
const files = fs.readdirSync(migrationsSrc).filter((f) => f.endsWith('.sql'));
for (const f of files) {
  fs.copyFileSync(path.join(migrationsSrc, f), path.join(migrationsDst, f));
}

// Copia seed
if (fs.existsSync(seedSrc)) {
  fs.copyFileSync(seedSrc, seedDst);
}

console.log(`✅ ${files.length} migrations + seed sincronizadas em supabase/`);