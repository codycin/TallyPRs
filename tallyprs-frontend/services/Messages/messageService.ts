import { apiFetch } from "@/services/apiClient";
import { create } from "domain";

export type ConversationResponse = {
  id: string;
  createdAtUtc: string;
};

export async function createConversation(
  otherUserId: string,
): Promise<ConversationResponse> {
  const response = await apiFetch("/conversations", {
    method: "POST",
    body: JSON.stringify({
      otherUserId,
    }),
  });
  const createdConversation: ConversationResponse = await response.json();

  return createdConversation;
}
