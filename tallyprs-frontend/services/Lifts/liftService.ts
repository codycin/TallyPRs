import { apiFetch } from "@/services/apiClient";
import type { LiftResponse } from "@/types/lift";

export async function searchLifts(query: string): Promise<LiftResponse[]> {
  const response = await apiFetch(
    `/lifts/search?q=${encodeURIComponent(query)}&limit=20`,
  );

  if (!response.ok) {
    throw new Error("Failed to search lifts");
  }

  return response.json();
}
