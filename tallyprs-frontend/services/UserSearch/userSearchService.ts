import { apiFetch } from "../apiClient";
import { UserSearchResult } from "@/types/userSearch";

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const response = await apiFetch(
    `/users/search?query=${encodeURIComponent(query)}`,
  );

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const json = await response.json();
      console.error("Search users failed:", json);
      throw new Error(JSON.stringify(json, null, 2));
    }

    const text = await response.text();
    console.error("Search users failed:", text);
    throw new Error(text || "Failed to search users");
  }

  return response.json();
}
