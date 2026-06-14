"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createConversation } from "@/services/Messages/messageService";

export default function NewConversationPage() {
  const router = useRouter();

  const [otherUserId, setOtherUserId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleCreateConversation() {
    if (!otherUserId.trim()) return;

    try {
      setIsCreating(true);
      setErrorMessage("");

      const conversation = await createConversation(otherUserId);

      router.push(`/messages/${conversation.id}`);
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not create conversation.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-black px-4 py-4">
        <h1 className="text-lg font-semibold">New Message</h1>
      </header>

      <div className="space-y-4 px-4 py-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            User ID
          </label>

          <input
            value={otherUserId}
            onChange={(e) => setOtherUserId(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            placeholder="Enter user id"
          />
        </div>

        {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}

        <button
          type="button"
          disabled={isCreating || !otherUserId.trim()}
          onClick={handleCreateConversation}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCreating ? "Creating..." : "Start Conversation"}
        </button>
      </div>
    </main>
  );
}
