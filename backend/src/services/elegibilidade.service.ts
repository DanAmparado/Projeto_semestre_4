import { supabaseAdmin } from '../lib/supabase';
import { Internal } from '../errors/httpErrors';
import { ElegibilidadeBody } from '../schemas/elegibilidade.schema';

type Resultado = { apto: boolean; motivos: string[] };

export async function avaliarElegibilidade(
  userId: string,
  body: ElegibilidadeBody
): Promise<Resultado> {
  const motivos: string[] = [];

  // Idade e peso já são validados pelo Zod (16-69 anos, 50-300 kg).
  // Aqui só ficam as regras de saúde e intervalo entre doações.

  if (body.gripado_febre) motivos.push('Não é possível doar com gripe ou febre');
  if (body.hepatite_hiv) motivos.push('Portador de hepatite B/C ou HIV não pode doar');
  if (body.tatuagem_ultimos_12_meses) {
    motivos.push('Aguarde 12 meses após tatuagem ou piercing');
  }
  if (body.cirurgia_ultimos_6_meses) {
    motivos.push('Aguarde 6 meses após cirurgia');
  }
  if (body.alcool_ultimas_12h) motivos.push('Não consuma álcool nas 12h anteriores à doação');
  if (body.drogas_ilicitas) motivos.push('Uso de drogas ilícitas impede a doação');
  if (body.sexo === 'F' && body.gravida_amamentando) {
    motivos.push('Gestantes e lactantes não podem doar');
  }

  // Intervalo desde a última doação (data do banco ou a do body)
  let ultimaDoacao = body.ultima_doacao ?? null;

  if (!ultimaDoacao) {
    const { data, error } = await supabaseAdmin
      .from('doacoes')
      .select('data_doacao')
      .eq('usuario_id', userId)
      .eq('status', 'realizada')
      .order('data_doacao', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw Internal(error.message);
    if (data) ultimaDoacao = data.data_doacao;
  }

  if (ultimaDoacao) {
    const dias = Math.floor(
      (Date.now() - new Date(ultimaDoacao + 'T00:00:00Z').getTime()) / (1000 * 60 * 60 * 24)
    );
    const intervaloMinimo = body.sexo === 'F' ? 60 : 90;
    if (dias < intervaloMinimo) {
      motivos.push(
        `Intervalo mínimo entre doações é de ${intervaloMinimo} dias (última há ${dias} dias)`
      );
    }
  }

  return { apto: motivos.length === 0, motivos };
}