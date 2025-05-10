'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserContextType = {
  username: string | null;
  login: (name: string) => void;
  logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("username");
    if (stored) setUsername(stored);
  }, []);

  const login = (name: string) => {
    localStorage.setItem("username", name);
    setUsername(name);
  };

  const logout = () => {
    localStorage.removeItem("username");
    setUsername(null);
  };

  return (
    <UserContext.Provider value={{ username, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};
