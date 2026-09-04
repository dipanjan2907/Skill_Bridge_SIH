import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  institution?: string;
  institution_id?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("skillbridge_token"),
  );
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("skillbridge_user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (err) {
        console.error("Error parsing saved user:", err);
      }
    }
    return null;
  });

  const isAuthenticated = Boolean(token && user);

  useEffect(() => {
    if (token) {
      localStorage.setItem("skillbridge_token", token);
    } else {
      localStorage.removeItem("skillbridge_token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("skillbridge_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("skillbridge_user");
    }
  }, [user]);

  const login = (newToken: string, newUser: User) => {
    sessionStorage.clear();
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    sessionStorage.clear();
    setToken(null);
    setUser(null);
    localStorage.removeItem("skillbridge_token");
    localStorage.removeItem("skillbridge_user");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
