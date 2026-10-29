export type User = {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  dataNascimento: string; // dd/mm/aaaa (na API: YYYY-MM-DD)
  genero: string;         // Masculino | Feminino | Outro | Prefiro não informar (na API: M | F | O)
  tipoSanguineo?: string;
  totalDoacoes?: number;
  pontos?: number;
  ultimaDoacao?: string | null;
};

export type RegisterData = {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  dataNascimento: string;
  genero: string;
  senha: string;
};

export type Doacao = {
  id: string;
  tipoSanguineo: string;
  data: string; // dd/mm/aaaa
  status: string;
  hemocentroId: string;
  local: string; // nome do hemocentro
};

export type StatusNivel = 'critico' | 'baixo' | 'normal';

export type NivelSangue = { tipo: string; nivel: number; status: StatusNivel }; // nivel em %

export type Hemocentro = { id: string; nome: string; cidade: string; estado: string };

export type EstoqueHemocentro = { hemocentro: Hemocentro; niveis: NivelSangue[] };

export type Notificacao = {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  canal: string;
  lida: boolean;
  created_at: string;
};
