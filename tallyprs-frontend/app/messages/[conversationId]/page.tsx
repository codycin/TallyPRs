"use client";

import { useEffect, useRef, useState } from "react";
import { HubConnection } from "@microsoft/signalr";
import { createMessageConnection } from "@/services/Messages/messageHub";

type MessageResponse = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  sentAtUtc: string;
};

type MessagePageProps = {
  conversationId: string;
};

export default function MessagePage({ conversationId }: MessagePageProps) {
  const connectionRef = useRef<HubConnection | null>(null);

  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [body, setBody] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connection = createMessageConnection();
    connectionRef.current = connection;

    connection.on("ReceiveMessage", (message: MessageResponse) => {
      setMessages((prev) => [...prev, message]);
    });

    async function start() {
      try {
        await connection.start();
        setIsConnected(true);

        await connection.invoke("JoinConversation", conversationId);
      } catch (error) {
        console.error("SignalR connection failed:", error);
      }
    }

    start();

    return () => {
      connection.off("ReceiveMessage");
      connection.stop();
    };
  }, [conversationId]);

  async function sendMessage() {
    if (!body.trim()) return;

    try {
      await connectionRef.current?.invoke("SendMessage", conversationId, body);

      setBody("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto min-h-screen w-full max-w-2xl bg-black md:min-h-0 md:rounded-3xl md:shadow-xl">
        <div className="min-h-screen bg-black text-white">
          <div className="mx-auto max-w-2xl">
            <header className="border-b border-zinc-800 px-4 py-4">
              <h1 className="text-lg font-semibold">Messages</h1>
              <p className="text-xs text-zinc-400">
                {isConnected ? "Connected" : "Connecting..."}
              </p>
            </header>

            <div className="space-y-3 px-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-2xl bg-zinc-900 px-4 py-2"
                >
                  <p>{message.body}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {new Date(message.sentAtUtc).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-full max-w-lg -translate-x-1/2 border-t border-zinc-800 bg-black p-4">
              <div className="flex gap-2">
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-w-0 flex-1 rounded-full bg-zinc-900 px-4 py-2 text-white outline-none"
                  placeholder="Message..."
                />

                <button
                  onClick={sendMessage}
                  className="rounded-full bg-blue-600 px-4 py-2 font-medium text-white"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
