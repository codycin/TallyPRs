import { buildAuthHeader } from "@/lib/auth/token";
import { API_BASE_URL } from "@/lib/api";
import {
  setAccessTokenInStorage,
  setRefreshTokenInStorage,
} from "@/lib/storage/authStorage";
import { RefreshAccessToken } from "@/services/authService";

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
  useRefresh: boolean = true,
): Promise<Response> {
  const authHeader = buildAuthHeader();

  const headers: HeadersInit = {
    ...authHeader,
    ...(options.headers ?? {}),
  };

  const isFormData = options.body instanceof FormData;

  if (!isFormData && !("Content-Type" in (headers as Record<string, string>))) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  let response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status !== 401 || !useRefresh) {
    return response;
  }

  const refreshed = await RefreshAccessToken();

  if (!refreshed) {
    return response;
  }

  setAccessTokenInStorage(refreshed.accessToken);
  setRefreshTokenInStorage(refreshed.refreshToken);

  const retryHeaders: HeadersInit = {
    ...buildAuthHeader(),
    ...(options.headers ?? {}),
  };

  if (
    !isFormData &&
    !("Content-Type" in (retryHeaders as Record<string, string>))
  ) {
    (retryHeaders as Record<string, string>)["Content-Type"] =
      "application/json";
  }

  return fetch(`${API_BASE_URL}/api${endpoint}`, {
    ...options,
    headers: retryHeaders,
  });
}
