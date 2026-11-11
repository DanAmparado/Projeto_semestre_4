import { supabaseAdmin } from '../lib/supabase';
import { Conflict, Internal, NotFound } from '../errors/httpErrors';
import { CriarDoadorBody } from '../schemas/doadores.schema';

type DoadorResumo = {
  id: string;
  nome_completo: string;
  tipo_sanguineo: string | null;
  total_doacoes: number;
  ultima_doacao: string | null;
};

export async function buscarDoadorPorCpf(cpf: string): Promise<DoadorResumo> {
  const { data: doador, error: doadorError } = await supabaseAdmin
    .from('usuarios')
    .select('id, nome_completo, tipo_sanguineo, total_doacoes')
    .eq('cpf', cpf)
    .maybeSingle();

  if (doadorError) throw Internal(doadorError.message);
  if (!doador) throw NotFound('Doador não encontrado');

  const { data: ultima, error: doacoesError } = await supabaseAdmin
    .from('doacoes')
    .select('data_doacao')
    .eq('usuario_id', doador.id)
    .eq('status', 'realizada')
    .order('data_doacao', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (doacoesError) throw Internal(doacoesError.message);

  return {
    id: doador.id,
    nome_completo: doador.nome_completo,
    tipo_sanguineo: doador.tipo_sanguineo,
    total_doacoes: doador.total_doacoes ?? 0,
    ultima_doacao: ultima?.data_doacao ?? null,
  };
}

function gerarSenhaTemporaria(): string {
  // 8 caracteres, sem ambíguos (0, O, I, l)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) {
    s += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return s.slice(0, 4) + '-' + s.slice(4);
}

export async function criarDoadorPeloFuncionario(body: CriarDoadorBody) {
  const senhaTemp = gerarSenhaTemporaria();

  const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
    email: body.email,
    password: senhaTemp,
    email_confirm: true,
    user_metadata: {
      nome_completo: body.nome_completo,
      cpf: body.cpf,
      data_nascimento: body.data_nascimento,
    },
  });

  if (error) {
    const msg = (error.message ?? '').toLowerCase();
    if (
      msg.includes('already') ||
      msg.includes('registered') ||
      msg.includes('duplicate') ||
      msg.includes('unique') ||
      msg.includes('exist')
    ) {
      throw Conflict('Email já cadastrado');
    }
    throw Internal(error.message);
  }

  // O trigger handle_new_user cria a linha em public.usuarios,
  // mas com placeholders. Complementa aqui.
  const { error: updError } = await supabaseAdmin
    .from('usuarios')
    .update({
      sexo: body.sexo,
      tipo_sanguineo: body.tipo_sanguineo,
      telefone: body.telefone,
      peso: body.peso ?? null,
    })
    .eq('id', authUser.user.id);

  if (updError) {
    // Se falhou o update do perfil, deleta o usuário do auth
    // para não deixar conta órfã.
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    throw Internal(updError.message);
  }

  return {
    id: authUser.user.id,
    email: body.email,
    senha_temporaria: senhaTemp,
  };
}