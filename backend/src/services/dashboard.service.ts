import { supabaseAdmin } from '../lib/supabase';
import { Internal } from '../errors/httpErrors';

export async function resumoDashboard(hemocentroId: string) {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  // Estoque + classificação
  const { data: estoque, error: eError } = await supabaseAdmin
    .from('estoque_sangue')
    .select('tipo_sanguineo, quantidade_bolsas, nivel_minimo, nivel_critico')
    .eq('hemocentro_id', hemocentroId)
    .order('tipo_sanguineo');

  if (eError) throw Internal(eError.message);

  const estoqueClassificado = (estoque ?? []).map((item) => {
    let nivel: 'normal' | 'baixo' | 'critico' = 'normal';
    if (item.quantidade_bolsas <= item.nivel_critico) nivel = 'critico';
    else if (item.quantidade_bolsas <= item.nivel_minimo) nivel = 'baixo';
    return { ...item, nivel };
  });

  const totalBolsas = estoqueClassificado.reduce((sum, e) => sum + e.quantidade_bolsas, 0);
  const tiposCriticos = estoqueClassificado
    .filter((e) => e.nivel === 'critico')
    .map((e) => e.tipo_sanguineo);

  // Doações do mês
  const { count: totalDoacoesMes, error: dError } = await supabaseAdmin
    .from('doacoes')
    .select('id', { count: 'exact', head: true })
    .eq('hemocentro_id', hemocentroId)
    .eq('status', 'realizada')
    .gte('data_doacao', inicioMes);

  if (dError) throw Internal(dError.message);

  // Doadores únicos no mês
  const { data: doadoresMes } = await supabaseAdmin
    .from('doacoes')
    .select('usuario_id')
    .eq('hemocentro_id', hemocentroId)
    .eq('status', 'realizada')
    .gte('data_doacao', inicioMes);

  const doadoresUnicos = new Set((doadoresMes ?? []).map((d) => d.usuario_id)).size;

  // Alertas pendentes por severidade
  const { data: alertasPendentes, error: aError } = await supabaseAdmin
    .from('alertas')
    .select('severidade')
    .eq('hemocentro_id', hemocentroId)
    .eq('resolvido', false);

  if (aError) throw Internal(aError.message);

  const porSeveridade = { info: 0, aviso: 0, critico: 0 };
  for (const a of alertasPendentes ?? []) {
    porSeveridade[a.severidade as keyof typeof porSeveridade] =
      (porSeveridade[a.severidade as keyof typeof porSeveridade] ?? 0) + 1;
  }
  const totalAlertasPendentes = alertasPendentes?.length ?? 0;

  return {
    kpis: {
      total_doacoes_mes: totalDoacoesMes ?? 0,
      doadores_unicos_mes: doadoresUnicos,
      total_bolsas: totalBolsas,
      alertas_pendentes: totalAlertasPendentes,
    },
    estoque: estoqueClassificado,
    alertas_por_severidade: porSeveridade,
    tipos_criticos: tiposCriticos,
  };
}