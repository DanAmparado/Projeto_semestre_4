import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken } from '../services/api';
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
const KEY = '@nosso-sangue/session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          setToken(saved.token);
          setUser(saved.user);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (token: string, u: User) => {
    setToken(token);
    setUser(u);
    await AsyncStorage.setItem(KEY, JSON.stringify({ token, user: u }));
  };

  const signIn = async (email: string, senha: string) => {
    const res = await api.login(email, senha);
    await persist(res.token, res.user);
  };

  const signUp = async (data: RegisterData) => {
    const res = await api.register(data);
    await persist(res.token, res.user);
  };

  const signOut = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem(KEY);
  };

  const updateUser = async (data: Partial<User>) => {
    const updated = await api.updateProfile(data);
    const raw = await AsyncStorage.getItem(KEY);
    const token = raw ? JSON.parse(raw).token : '';
    await persist(token, { ...user, ...updated } as User);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
