import { buildAuthHeader } from "@/lib/auth/token";
import { API_BASE_URL } from "@/lib/api";
import {
  setAccessTokenInStorage,
  setRefreshTokenInStorage,
} from "@/lib/storage/authStorage";
import { RefreshAccessToken } from "@/services/authService";
import { ApiError } from "@/utils/apiError";

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
  useRefresh: boolean = true,
): Promise<Response> {
  const isFormData = options.body instanceof FormData;

  function buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      ...buildAuthHeader(),
      ...(options.headers ?? {}),
    };

    if (
      !isFormData &&
      !("Content-Type" in (headers as Record<string, string>))
    ) {
      (headers as Record<string, string>)["Content-Type"] = "application/json";
    }

    return headers;
  }

  let response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    ...options,
    headers: buildHeaders(),
  });

  if (response.status === 401 && useRefresh) {
    const refreshed = await RefreshAccessToken();

    if (refreshed) {
      setAccessTokenInStorage(refreshed.accessToken);
      setRefreshTokenInStorage(refreshed.refreshToken);

      response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
        ...options,
        headers: buildHeaders(),
      });
    }
  }

  if (!response.ok) {
    let errorBody: unknown = null;
    let message = `API failed with status ${response.status}`;

    try {
      errorBody = await response.json();

      if (
        typeof errorBody === "object" &&
        errorBody !== null &&
        "message" in errorBody &&
        typeof errorBody.message === "string"
      ) {
        message = errorBody.message;
      }
    } catch {
      // no JSON body
    }

    throw new ApiError(message, response.status, errorBody);
  }

  return response;
}
