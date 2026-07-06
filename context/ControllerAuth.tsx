"use client";

// ============================================================
//  context/ControllerAuth.tsx
//  Autenticação simples do controlador via PIN
//  (separado do operador — controlador tem acesso ao dashboard)
// ============================================================

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface ControllerAuthState {
  isAuthenticated: boolean;
  controllerName: string;
  login: (name: string, pin: string) => Promise<boolean>;
  logout: () => void;
}

const ControllerAuthContext = createContext<ControllerAuthState>({
  isAuthenticated: false,
  controllerName: "",
  login: async () => false,
  logout: () => {},
});

// PIN do controlador — em produção viria do banco igual ao operador
// Por ora é fixo para o MVP: qualquer nome + PIN 9999
const CONTROLLER_PIN = "9999";

export function ControllerAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [controllerName, setControllerName] = useState("");

  useEffect(() => {
    try {
      // 1. Mudamos de sessionStorage para localStorage aqui
      const saved = localStorage.getItem("controller_auth");
      if (saved) {
        const { name } = JSON.parse(saved);
        setControllerName(name);
        setIsAuthenticated(true);
      }
    } catch {}
  }, []);

  const login = async (name: string, pin: string): Promise<boolean> => {
    if (!name.trim() || pin !== CONTROLLER_PIN) return false;
    const data = { name: name.trim() };
    
    // 2. Mudamos de sessionStorage para localStorage aqui
    localStorage.setItem("controller_auth", JSON.stringify(data));
    
    setControllerName(name.trim());
    setIsAuthenticated(true);
    return true;
  };

  const logout = () => {
    // 3. Mudamos de sessionStorage para localStorage aqui
    localStorage.removeItem("controller_auth");
    setIsAuthenticated(false);
    setControllerName("");
  };

  return (
    <ControllerAuthContext.Provider value={{ isAuthenticated, controllerName, login, logout }}>
      {children}
    </ControllerAuthContext.Provider>
  );
}

export const useControllerAuth = () => useContext(ControllerAuthContext);