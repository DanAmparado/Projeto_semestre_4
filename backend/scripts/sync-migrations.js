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

// Remove seed.sql órfão em migrations/ (erro comum de versões anteriores)
const staleSeed = path.join(migrationsDst, 'seed.sql');
if (fs.existsSync(staleSeed)) fs.unlinkSync(staleSeed);

// Copia migrations
const files = fs.readdirSync(migrationsSrc).filter((f) => f.endsWith('.sql'));
for (const f of files) {
  fs.copyFileSync(path.join(migrationsSrc, f), path.join(migrationsDst, f));
}

// Copia seed (se existir)
let seedInfo = '';
if (fs.existsSync(seedSrc)) {
  fs.copyFileSync(seedSrc, seedDst);
  seedInfo = ' + seed';
} else {
  // remove seed antigo no destino, para não confundir o supabase db reset
  if (fs.existsSync(seedDst)) fs.unlinkSync(seedDst);
  seedInfo = ' (seed.sql ausente)';
}

console.log(`✅ ${files.length} migrations sincronizadas${seedInfo}`);