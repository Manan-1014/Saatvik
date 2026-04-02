import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface User {
  id: number;
  name: string | null;
  email: string | null;
  phone?: string | null;
  role: string;
  status: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("tiffin_token"));
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("tiffin_user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("tiffin_token"));
  }, []);

  function login(newToken: string, newUser: User) {
    localStorage.setItem("tiffin_token", newToken);
    localStorage.setItem("tiffin_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setAuthTokenGetter(() => newToken);
  }

  function logout() {
    localStorage.removeItem("tiffin_token");
    localStorage.removeItem("tiffin_user");
    setToken(null);
    setUser(null);
    setAuthTokenGetter(() => null);
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token && !!user,
      isAdmin: user?.role === "admin",
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
