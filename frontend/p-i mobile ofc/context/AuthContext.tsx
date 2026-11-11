import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api, generoParaSexo, mapUser, toPatchBody } from '../services/api';
import { RegisterData, User } from '../types';

type Ctx = {
  user: User | null;
  signedIn: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
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
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lê a sessão e busca GET /me. Nunca lança: falhas viram `error`.
  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSignedIn(!!session);
      if (!session) {
        setUser(null);
        setError(null);
        return;
      }
      const me = await api.getMe();
      setUser(mapUser(me, session.user.email ?? ''));
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Não foi possível carregar o perfil.');
    }
  };

  const refetch = async () => {
    setLoading(true);
    await loadProfile();
    setLoading(false);
  };

  useEffect(() => {
    loadProfile().finally(() => setLoading(false));

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSignedIn(false);
        setError(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, senha: string) => {
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (authError) throw new Error(authError.message);
    await loadProfile();
  };

  const signUp = async (d: RegisterData) => {
    const { data, error: signUpError } = await supabase.auth.signUp({ email: d.email, password: d.senha });
    if (signUpError) throw new Error(signUpError.message);
    if (!data.session) {
      throw new Error('Conta criada. Confirme seu e-mail para continuar e depois faça login.');
    }
    setSignedIn(true);

    try {
      const me = await api.patchMe({
        nome_completo: d.nome,
        cpf: d.cpf.replace(/\D/g, ''),
        data_nascimento: d.dataNascimento.split('/').reverse().join('-'),
        sexo: generoParaSexo(d.genero),
        telefone: d.telefone,
      });
      setUser(mapUser(me, data.session.user.email ?? d.email));
      setError(null);
    } catch (e: any) {
      await loadProfile();
      throw new PerfilIncompletoError(e.message);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSignedIn(false);
    setError(null);
  };

  const updateUser = async (data: Partial<User>) => {
    const me = await api.patchMe(toPatchBody(data));
    setUser(mapUser(me, user?.email ?? ''));
  };

  return (
    <AuthContext.Provider
      value={{ user, signedIn, loading, error, refetch, signIn, signUp, signOut, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);