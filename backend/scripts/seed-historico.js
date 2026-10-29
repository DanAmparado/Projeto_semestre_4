#!/usr/bin/env node
// Seed de dados históricos para demonstração e relatórios.
// Cria 15 doadores e ~150 doações em 52 semanas, mais 250 leituras de ambiente.
// Idempotente: apaga e recria apenas dados marcados como SEED_HISTORICO.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const HEMOCENTRO_ID = '11111111-1111-1111-1111-111111111111';
const SENSOR_AMBIENTE_ID = '33333333-3333-3333-3333-333333333301';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const DONORS = [
  { email: 'seed01@test.local', nome: 'Ana Souza',       cpf: '10000000001', nascimento: '1998-03-12', sexo: 'F', tipo: 'O+',  peso: 58.5 },
  { email: 'seed02@test.local', nome: 'Bruno Lima',      cpf: '10000000002', nascimento: '1995-07-22', sexo: 'M', tipo: 'O+',  peso: 78.0 },
  { email: 'seed03@test.local', nome: 'Carla Mendes',    cpf: '10000000003', nascimento: '2002-11-05', sexo: 'F', tipo: 'O+',  peso: 62.0 },
  { email: 'seed04@test.local', nome: 'Diego Rocha',     cpf: '10000000004', nascimento: '1985-04-18', sexo: 'M', tipo: 'O+',  peso: 82.5 },
  { email: 'seed05@test.local', nome: 'Elena Ferreira',  cpf: '10000000005', nascimento: '1993-01-30', sexo: 'F', tipo: 'A+',  peso: 55.0 },
  { email: 'seed06@test.local', nome: 'Felipe Costa',    cpf: '10000000006', nascimento: '1980-09-15', sexo: 'M', tipo: 'A+',  peso: 88.0 },
  { email: 'seed07@test.local', nome: 'Gabriela Alves',  cpf: '10000000007', nascimento: '2000-06-08', sexo: 'F', tipo: 'A+',  peso: 60.5 },
  { email: 'seed08@test.local', nome: 'Henrique Dias',   cpf: '10000000008', nascimento: '1975-12-20', sexo: 'M', tipo: 'B+',  peso: 75.0 },
  { email: 'seed09@test.local', nome: 'Isabela Martins', cpf: '10000000009', nascimento: '1997-08-14', sexo: 'F', tipo: 'B+',  peso: 54.0 },
  { email: 'seed10@test.local', nome: 'João Pereira',    cpf: '10000000010', nascimento: '1968-02-28', sexo: 'M', tipo: 'AB+', peso: 70.0 },
  { email: 'seed11@test.local', nome: 'Karina Lopes',    cpf: '10000000011', nascimento: '1991-05-11', sexo: 'F', tipo: 'AB+', peso: 59.5 },
  { email: 'seed12@test.local', nome: 'Lucas Gomes',     cpf: '10000000012', nascimento: '1988-10-03', sexo: 'M', tipo: 'O-',  peso: 72.0 },
  { email: 'seed13@test.local', nome: 'Marina Ribeiro',  cpf: '10000000013', nascimento: '1996-09-07', sexo: 'F', tipo: 'A-',  peso: 57.0 },
  { email: 'seed14@test.local', nome: 'Nelson Castro',   cpf: '10000000014', nascimento: '1979-03-22', sexo: 'M', tipo: 'B-',  peso: 85.0 },
  { email: 'seed15@test.local', nome: 'Olívia Teixeira', cpf: '10000000015', nascimento: '2003-07-16', sexo: 'F', tipo: 'AB-', peso: 52.0 },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}
function daysAgoToDate(days) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

async function ensureDonor(d) {
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list.users.find((u) => u.email === d.email);

  let userId;
  if (existing) {
    userId = existing.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: d.email,
      password: 'senha123',
      email_confirm: true,
      user_metadata: {
        nome_completo: d.nome,
        cpf: d.cpf,
        data_nascimento: d.nascimento,
      },
    });
    if (error) throw error;
    userId = data.user.id;
  }

  await supabase.from('usuarios').upsert(
    {
      id: userId,
      nome_completo: d.nome,
      cpf: d.cpf,
      data_nascimento: d.nascimento,
      sexo: d.sexo,
      tipo_sanguineo: d.tipo,
      telefone: `(16) 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
      peso: d.peso,
    },
    { onConflict: 'id' }
  );

  return { ...d, userId };
}

async function main() {
  console.log('🧹 Limpando dados de seed anteriores...');
  await supabase.from('doacoes').delete().eq('observacao', 'SEED_HISTORICO');
  await supabase.from('leituras_ambiente').delete().gte('id', 0);

  console.log(`👥 Garantindo ${DONORS.length} doadores de teste...`);
  const donors = [];
  for (const d of DONORS) {
    donors.push(await ensureDonor(d));
  }
  console.log(`   ✅ ${donors.length} doadores prontos`);

  console.log('💉 Gerando ~150 doações em 52 semanas...');
  const seasonalByMonth = [1.2, 1.1, 1.0, 0.9, 0.8, 1.3, 1.4, 1.0, 0.9, 1.0, 1.2, 1.5];
  const doacoes = [];
  for (let weeksAgo = 51; weeksAgo >= 0; weeksAgo--) {
    const month = new Date(Date.now() - weeksAgo * 7 * 86400000).getMonth();
    const seasonal = seasonalByMonth[month];
    const count = Math.round((2 + Math.random() * 2) * seasonal);
    for (let i = 0; i < count; i++) {
      const donor = pick(donors);
      const daysAgo = weeksAgo * 7 + randomInt(0, 6);
      doacoes.push({
        usuario_id: donor.userId,
        hemocentro_id: HEMOCENTRO_ID,
        tipo_sanguineo: donor.tipo,
        data_doacao: daysAgoToDate(daysAgo),
        status: 'realizada',
        peso: donor.peso,
        observacao: 'SEED_HISTORICO',
      });
    }
  }
  for (let i = 0; i < doacoes.length; i += 50) {
    const batch = doacoes.slice(i, i + 50);
    const { error } = await supabase.from('doacoes').insert(batch);
    if (error) throw error;
  }
  console.log(`   ✅ ${doacoes.length} doações inseridas`);

  console.log('🌡️  Gerando 250 leituras de ambiente em 30 dias...');
  // Limpa alertas de ambiente antigos (referencia_id = sensor_id para alertas de ambiente)
  await supabase.from('alertas').delete().eq('referencia_id', SENSOR_AMBIENTE_ID);

  const round1 = (v) => Math.round(v * 10) / 10;
  const leituras = [];
  for (let i = 0; i < 250; i++) {
    const hoursAgo = randomInt(0, 30 * 24);
    const created_at = new Date(Date.now() - hoursAgo * 3600000).toISOString();
    const outlier = Math.random() < 0.04;

    // Faixa normal: 3.0-5.0°C (dentro de 2-6°C)
    // Outlier baixo: -2.0 a 1.5°C (abaixo do mínimo)
    // Outlier alto: 6.5 a 9.5°C (acima do máximo)
    let temperatura;
    if (outlier) {
      temperatura = Math.random() < 0.5
        ? round1(-2.0 + Math.random() * 3.5)
        : round1(6.5 + Math.random() * 3.0);
    } else {
      temperatura = round1(3.0 + Math.random() * 2.0);
    }

    // Umidade normal: 50-80%
    const umidade = round1(55 + Math.random() * 25);
    leituras.push({
      sensor_id: SENSOR_AMBIENTE_ID,
      temperatura,
      umidade,
      created_at,
    });
  }
  for (let i = 0; i < leituras.length; i += 50) {
    const batch = leituras.slice(i, i + 50);
    const { error } = await supabase.from('leituras_ambiente').insert(batch);
    if (error) throw error;
  }
  console.log(`   ✅ ${leituras.length} leituras inseridas`);
  
  console.log('🔢 Recalculando contadores dos doadores...');
  for (const donor of donors) {
    const { count } = await supabase
      .from('doacoes')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', donor.userId)
      .eq('status', 'realizada');

    await supabase.from('usuarios')
      .update({ total_doacoes: count ?? 0, pontos: (count ?? 0) * 10 })
      .eq('id', donor.userId);
  }
  console.log('   ✅ contadores atualizados');

  console.log('\n🎉 Seed concluído!');
  console.log('   Doadores de teste:');
  for (const d of donors) {
    console.log(`     ${d.email}  /  ${d.nome}  /  ${d.tipo}`);
  }
  console.log('\n   Senha de todos: senha123');
  console.log('   Total doações: ' + doacoes.length);
  console.log('   Total leituras: ' + leituras.length);
}

main().catch((err) => {
  console.error('❌ Falhou:', err.message || err);
  process.exit(1);
});