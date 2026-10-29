export const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

export const GENEROS = ['Masculino', 'Feminino', 'Outro', 'Prefiro não informar'];

export const NOTICIAS = [
  { id: '1', titulo: 'Notícia 1' },
  { id: '2', titulo: 'Notícia 2' },
  { id: '3', titulo: 'Notícia 3' },
];

export const REQUISITOS: { titulo: string; cor: 'dark' | 'bright'; itens: string[] }[] = [
  {
    titulo: 'IDENTIFICAÇÃO',
    cor: 'dark',
    itens: ['Possuir entre 16 e 69 anos;', 'Levar um documento com foto (RG ou CNH);'],
  },
  {
    titulo: 'ALIMENTAÇÃO',
    cor: 'bright',
    itens: [
      'Fazer refeições leves antes da doação;',
      'Não ter consumido bebidas alcoólicas 12 horas antes de doar;',
      'Estar bem hidratado.',
    ],
  },
  {
    titulo: 'SAÚDE',
    cor: 'dark',
    itens: [
      'Pesar no mínimo 50 kg;',
      'Ter dormido ao menos 6 horas na noite anterior;',
      'Qualquer sintoma de doença, adiar a doação por no mínimo 30 dias (consulte o médico em casos sérios);',
      'Tendo feito piercing e tatuagem, aguardar no mínimo 6 meses para doar;',
      'Consultar o médico caso tenha tomado vacinas;',
      'Grávidas não podem doar e lactantes somente 1 ano após o parto;',
      'Em caso de cirurgias ou câncer, consultar seu médico.',
    ],
  },
  {
    titulo: 'TEMPO DE DOAÇÃO',
    cor: 'bright',
    itens: ['Homens: 60 dias;', 'Mulheres: 90 dias;'],
  },
];
