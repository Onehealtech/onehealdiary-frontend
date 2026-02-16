import React, { createContext, useContext, useState, ReactNode } from "react";

type Role = "super_admin" | "vendor" | "doctor" | "assistant";

export interface AuthUser {
  id: string;
  fullName: string;
  role: Role;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (user: AuthUser) => void;   // ✅ FIXED
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser && storedUser !== "undefined"
        ? JSON.parse(storedUser)
        : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const login = (user: AuthUser) => {
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("tempToken");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
