"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getAccessTokenFromStorage,
  setAccessTokenInStorage,
  removeAccessTokenFromStorage,
  removeRefreshTokenFromStorage,
  setRefreshTokenInStorage,
} from "@/lib/storage/authStorage";

type AuthContextType = {
  isLoggedIn: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = getAccessTokenFromStorage();
    setIsLoggedIn(!!token);
  }, []);

  const login = (accessToken: string, refreshToken: string) => {
    setAccessTokenInStorage(accessToken);
    setRefreshTokenInStorage(refreshToken);
    setIsLoggedIn(true);
  };

  const logout = () => {
    removeAccessTokenFromStorage();
    removeRefreshTokenFromStorage();
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
