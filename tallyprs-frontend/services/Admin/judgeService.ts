import type { JudgeRequest } from "../../types/judge";
import { apiFetch } from "../apiClient";

export default async function judgePost(postId: string, request: JudgeRequest) {
  const response = await apiFetch(`/posts/${postId}/judge`, {
    method: "PUT",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `API Error Status: ${response.status} ${response.statusText}`,
    );
    console.error(`API Error Details: ${errorText}`);
    throw new Error(`API failed with status ${response.status}`);
  }

  return response.json();
}
