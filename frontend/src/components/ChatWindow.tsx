import { MessageBubble } from "@/components/MessageBubble";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StreamStatus } from "@/types/agent";

type Props = {
  question: string;
  answer: string;
  status: StreamStatus;
  error?: string | null;
};

export function ChatWindow({ question, answer, status, error }: Props) {
  const hasContent = question || answer || error;

  return (
    <ScrollArea className="flex-1 w-full rounded-md border bg-card">
      <div className="flex flex-col gap-3 p-4 min-h-[280px]">
        {!hasContent && (
          <p className="text-sm text-muted-foreground text-center mt-12">
            質問を入力してエージェントに問い合わせてください。
          </p>
        )}
        {question && <MessageBubble from="user">{question}</MessageBubble>}
        {status === "streaming" && (
          <MessageBubble from="assistant">
            <span className="text-muted-foreground">考え中...</span>
          </MessageBubble>
        )}
        {answer && status !== "streaming" && (
          <MessageBubble from="assistant">{answer}</MessageBubble>
        )}
        {status === "error" && error && (
          <MessageBubble from="assistant">
            <span className="text-destructive">エラー: {error}</span>
          </MessageBubble>
        )}
      </div>
    </ScrollArea>
  );
}
