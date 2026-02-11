import React, { createContext, useContext, useState, ReactNode } from "react";

type Role = "super_admin" | "vendor" | "doctor" | "assistant";

interface AuthUser {
  id: string;
  name: string;
  role: Role;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (role: Role) => void;
  logout: () => void;
}

const mockUsers: Record<Role, AuthUser> = {
  super_admin: { id: "SA001", name: "Admin User", role: "super_admin", email: "admin@oneheal.com" },
  vendor: { id: "V001", name: "Rajesh Medical Store", role: "vendor" },
  doctor: { id: "D001", name: "Dr. Priya Sharma", role: "doctor", email: "priya.sharma@aiims.com" },
  assistant: { id: "A001", name: "Nurse Sunita", role: "assistant", email: "sunita@aiims.com" },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const login = (role: Role) => setUser(mockUsers[role]);
  const logout = () => setUser(null);
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
