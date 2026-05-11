// src/lib/storage/authStorage.ts
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export function getAccessTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessTokenInStorage(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function removeAccessTokenFromStorage(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getRefreshTokenFromStorage() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshTokenInStorage(token: string) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function removeRefreshTokenFromStorage() {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
