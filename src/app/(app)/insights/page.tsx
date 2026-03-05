"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "Give me an overview of my team's performance this cycle",
  "Who are my top performers and what makes them stand out?",
  "Which team members might be at risk of disengagement?",
  "Where are the biggest gaps between self-assessment and manager assessment?",
  "What development opportunities should I prioritize for my team?",
  "Summarize talent density and cultural momentum across the team",
];

export default function InsightsPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isManagerRole = ["MANAGER", "AREA_LEAD", "LEADERSHIP", "ADMIN"].includes(
    session?.user?.role || ""
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(question: string) {
    if (!question.trim() || streaming) return;

    const userMessage: Message = { role: "user", content: question.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setStreaming(true);
    setError("");

    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          conversationHistory: messages,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to get insights");
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError("Failed to read response");
        setStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages([...updatedMessages, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              setError(parsed.error);
              break;
            }
            if (parsed.text) {
              assistantContent += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                };
                return updated;
              });
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    } catch {
      setError("Failed to connect to AI service");
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  if (!isManagerRole) {
    return (
      <div className="text-center py-12 text-visory-mid-grey">
        Insights are available for managers and above.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-visory-navy">Insights</h1>
        <p className="text-sm text-visory-mid-grey mt-1">
          Ask questions about your team&apos;s assessment data powered by AI
        </p>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-visory-mid-grey mb-6">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
                <p className="text-sm font-medium">Ask a question about your team</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl w-full">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="text-left text-sm p-3 rounded-lg border border-visory-border hover:border-visory hover:bg-visory-light transition-colors text-visory-navy"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-visory text-white"
                      : "bg-visory-grey text-visory-navy"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: formatMarkdown(msg.content),
                      }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                  {streaming && i === messages.length - 1 && msg.role === "assistant" && (
                    <span className="inline-block w-1.5 h-4 bg-visory-navy/50 animate-pulse ml-0.5" />
                  )}
                </div>
              </div>
            ))
          )}
          {error && (
            <div className="text-center">
              <p className="text-sm text-red-600 bg-red-50 inline-block px-4 py-2 rounded-lg">
                {error}
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="border-t border-visory-border p-4">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your team's performance, trends, risks..."
              rows={1}
              className="flex-1 resize-none rounded-lg border border-visory-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-visory/30 focus:border-visory text-visory-navy placeholder:text-visory-mid-grey"
            />
            <Button onClick={() => sendMessage(input)} disabled={!input.trim() || streaming}>
              {streaming ? "..." : "Send"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function formatMarkdown(text: string): string {
  if (!text) return "";
  return text
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    // Line breaks
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}
