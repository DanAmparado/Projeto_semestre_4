export type User = {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  dataNascimento: string; // dd/mm/aaaa
  genero: string;
  tipoSanguineo?: string;
  pessoasAjudadas?: number;
};

export type RegisterData = Omit<User, 'id' | 'tipoSanguineo' | 'pessoasAjudadas'> & { senha: string };

export type Doacao = { id: string; data: string; local: string };

export type NivelSangue = { tipo: string; nivel: number }; // nivel em %
