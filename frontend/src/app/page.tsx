"use client";

import { AppShell } from "@/components/AppShell";
import { ChatInput } from "@/components/ChatInput";
import { ChatWindow } from "@/components/ChatWindow";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { useChat } from "@/hooks/useAgentStream";

export default function Home() {
  const chat = useChat();

  return (
    <AppShell
      title="Gemini × LangGraph Agent"
      subtitle="research → reflection → answer のループで Gemini に質問します。"
      sidebar={
        <ConversationSidebar
          conversations={chat.conversations}
          activeConversationId={chat.activeConversationId}
          onSelect={chat.selectConversation}
          onCreate={chat.createConversation}
          onDelete={chat.deleteConversation}
        />
      }
    >
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
        isStreaming={chat.status === "streaming"}
        onAbort={chat.abort}
      />
    </AppShell>
  );
}
