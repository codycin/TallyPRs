"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getAccessTokenFromStorage,
  setAccessTokenInStorage,
  removeAccessTokenFromStorage,
  removeRefreshTokenFromStorage,
  setRefreshTokenInStorage,
  getRefreshTokenFromStorage,
} from "@/lib/storage/authStorage";

type AuthContextType = {
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function refreshAccessToken() {
  const refreshToken = getRefreshTokenFromStorage();

  if (!refreshToken) {
    throw new Error("No refresh token found");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Refresh token failed");
  }

  return response.json();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const accessToken = getAccessTokenFromStorage();

        if (accessToken) {
          setIsLoggedIn(true);
          return;
        }

        const data = await refreshAccessToken();

        setAccessTokenInStorage(data.accessToken);

        if (data.refreshToken) {
          setRefreshTokenInStorage(data.refreshToken);
        }

        setIsLoggedIn(true);
      } catch (error) {
        removeAccessTokenFromStorage();
        removeRefreshTokenFromStorage();
        setIsLoggedIn(false);
      } finally {
        setIsAuthLoading(false);
      }
    }

    checkAuth();
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
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isAuthLoading,
        login,
        logout,
      }}
    >
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
/*"use client";

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
  */
