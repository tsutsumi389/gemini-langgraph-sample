"use client";

import { AgentTrace } from "@/components/AgentTrace";
import { ChatInput } from "@/components/ChatInput";
import { ChatWindow } from "@/components/ChatWindow";
import { useAgentStream } from "@/hooks/useAgentStream";

export default function Home() {
  const stream = useAgentStream();

  return (
    <main className="flex-1 w-full flex justify-center bg-background">
      <div className="w-full max-w-2xl flex flex-col gap-4 p-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Gemini × LangGraph Agent</h1>
          <p className="text-sm text-muted-foreground">
            research → reflection → answer のループで Gemini に質問します。
          </p>
        </header>

        <AgentTrace trace={stream.trace} status={stream.status} />

        <ChatWindow
          question={stream.question}
          answer={stream.answer}
          status={stream.status}
          error={stream.error}
        />

        <ChatInput
          onSend={(q) => {
            void stream.send(q);
          }}
          disabled={stream.status === "streaming"}
        />
      </div>
    </main>
  );
}
