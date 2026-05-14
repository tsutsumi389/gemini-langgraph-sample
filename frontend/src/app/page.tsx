"use client";

import { ChatInput } from "@/components/ChatInput";
import { ChatWindow } from "@/components/ChatWindow";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useChat } from "@/hooks/useAgentStream";

export default function Home() {
  const chat = useChat();

  return (
    <main className="flex-1 w-full flex justify-center bg-background">
      <div className="w-full max-w-2xl flex flex-col gap-4 p-6">
        <header className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold">Gemini × LangGraph Agent</h1>
            <p className="text-sm text-muted-foreground">
              research → reflection → answer のループで Gemini に質問します。
            </p>
          </div>
          <ThemeToggle />
        </header>

        <ChatWindow
          messages={chat.messages}
          activeAssistantId={chat.activeAssistantId}
          onSampleClick={(q) => {
            void chat.send(q);
          }}
          onRegenerate={(id) => {
            void chat.regenerate(id);
          }}
        />

        <ChatInput
          onSend={(q) => {
            void chat.send(q);
          }}
          disabled={chat.status === "streaming"}
        />
      </div>
    </main>
  );
}
