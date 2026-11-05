import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api, generoParaSexo, mapUser, toPatchBody } from '../services/api';
import { RegisterData, User } from '../types';

type Ctx = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, senha: string) => Promise<void>;
  signUp: (data: RegisterData) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<Ctx>({} as Ctx);

/** Conta criada no Supabase, mas o PATCH /me falhou (ex.: CPF já cadastrado). */
export class PerfilIncompletoError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'PerfilIncompleto';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // GET /me + e-mail da sessão do Supabase
  const loadProfile = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return setUser(null);
    const me = await api.getMe();
    setUser(mapUser(me, session.user.email ?? ''));
  };

  useEffect(() => {
    // O SDK já persiste e renova a sessão; aqui só retomamos o perfil ao abrir o app.
    loadProfile()
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setUser(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, senha: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) throw new Error(error.message);
    await loadProfile();
  };

  const signUp = async (d: RegisterData) => {
    // Passo 1: cria a conta no Supabase Auth
    const { data, error } = await supabase.auth.signUp({ email: d.email, password: d.senha });
    if (error) throw new Error(error.message);
    if (!data.session) {
      throw new Error('Conta criada. Confirme seu e-mail para continuar e depois faça login.');
    }

    // Passo 2: completa o perfil no back-end (a senha não vai para o /me)
    try {
      const me = await api.patchMe({
        nome_completo: d.nome,
        cpf: d.cpf.replace(/\D/g, ''),
        data_nascimento: d.dataNascimento.split('/').reverse().join('-'), // YYYY-MM-DD
        sexo: generoParaSexo(d.genero),
        telefone: d.telefone,
      });
      setUser(mapUser(me, data.session.user.email ?? d.email));
    } catch (e: any) {
      // a conta já existe: carrega o perfil padrão para o usuário poder corrigir em "Editar perfil"
      await loadProfile().catch(() => {});
      throw new PerfilIncompletoError(e.message);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUser = async (data: Partial<User>) => {
    const me = await api.patchMe(toPatchBody(data));
    setUser(mapUser(me, user?.email ?? ''));
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
