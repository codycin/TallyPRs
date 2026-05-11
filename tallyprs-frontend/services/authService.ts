import type { AuthResponse, LoginRequest, RegisterRequest } from "@/types/auth";
import { apiFetch } from "./apiClient";
import { getRefreshTokenFromStorage } from "@/lib/storage/authStorage";
import { API_BASE_URL } from "@/lib/api";

export async function registerUser(
  request: RegisterRequest,
): Promise<AuthResponse> {
  const response = await apiFetch(
    `/auth/register`,
    {
      method: "POST",
      body: JSON.stringify(request),
    },
    false,
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Registration Failed");
  }

  return response.json();
}

export async function loginUser(request: LoginRequest): Promise<AuthResponse> {
  const response = await apiFetch(
    `/auth/login`,
    {
      method: "POST",
      body: JSON.stringify(request),
    },
    false,
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Login Failed");
  }

  return response.json();
}

export async function RefreshAccessToken(): Promise<AuthResponse | null> {
  const refreshToken = getRefreshTokenFromStorage();

  if (!refreshToken) return null;

  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) return null;

  return response.json();
}
