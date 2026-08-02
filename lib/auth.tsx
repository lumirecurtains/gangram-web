"use client";

// 🔐 Auth — owner login (Firebase email/password) + owner check

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { onSettings } from "@/lib/data";
import { Settings } from "@/lib/types";

interface AuthCtx {
  user: User | null;
  isOwner: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    const unsubSettings = onSettings((s: Settings) => {
      const emails = (s.ownerEmails || []).map((e) => e.toLowerCase());
      setIsOwner(!!user && emails.includes((user.email || "").toLowerCase()));
      setLoading(false);
    });
    return () => {
      unsubAuth();
      unsubSettings();
    };
  }, [user]);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <Ctx.Provider value={{ user, isOwner, loading, signIn, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
