import { useState } from 'react';
import { FaFile, FaTimes } from 'react-icons/fa';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Skeleton } from "~/components/ui/skeleton"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible"
import { CheckCircle, ChevronsUpDown, Copy } from "lucide-react";
import { CodeBlock, CopyBlock, dracula } from "react-code-blocks";
import ReactMarkdown from "react-markdown";

interface Attachment {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  content?: string;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  partial?: boolean;
  tokensPerSecond?: number;
  thinking?: string | null;
  attachments?: Attachment[];
}

interface ChatMessageProps {
  messages: Message[];
  previewAttachment: (attachment: Attachment) => void;
  handleCopyCode: (code: string) => void;
  copiedCode: string | null;
}

const extractCode = (text: string): { code: string | null; language: string | undefined } => {
  const codeBlockRegex = /```(.*?)\n([\s\S]*?)```/g; // Matches code blocks with or without language
  const match = codeBlockRegex.exec(text);

  if (match) {
    const language = match[1]?.trim() ?? undefined; // Extract language, if specified
    const code = match[2]?.trim() ?? null;        // Extract code content

    return { code, language };
  }

  return { code: null, language: undefined };
};

export function ChatMessage({
  messages,
  previewAttachment,
  handleCopyCode,
  copiedCode,
}: ChatMessageProps) {
  return (
    <>
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        //const { code, language } = extractCode(msg.content);
        //const isCodeResponse = msg.role === 'assistant' && code !== null;

        return (
          <div key={index} className="space-y-2">
            {/* Thinking Section */}
            {msg.role === 'assistant' && msg.thinking && (
              <div className="flex justify-start">
                <Collapsible className="max-w-[80%]">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-2 text-xs">
                      <Badge variant="secondary" className="mr-2">🤔 Thinking</Badge>
                      <ChevronsUpDown className="h-3 w-3" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground border-l-4 border-muted-foreground/30">
                      <pre className="whitespace-pre-wrap font-mono text-xs">{msg.thinking}</pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {/* Attachments */}
            {msg.attachments && msg.attachments.length > 0 && (
              <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${isUser ? 'order-2 mr-4' : 'order-1 ml-4'}`}>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {msg.attachments.map((attachment) => (
                      <Button
                        key={attachment.id}
                        variant="outline"
                        size="sm"
                        className="h-auto p-2 text-xs"
                        onClick={() => previewAttachment(attachment)}
                      >
                        <FaFile className="h-3 w-3 mr-1" />
                        {attachment.fileName}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Main Message Bubble */}
            <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
                {/*isCodeResponse ? (
                  <div className="relative bg-card border rounded-lg overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between bg-muted/50 px-3 py-2 border-b">
                      <span className="text-xs font-medium text-muted-foreground">
                        {language ?? 'Code'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleCopyCode(code)}
                      >
                        {copiedCode === code ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <div className="p-0">
                      <CodeBlock
                        text={code}
                        language={language ?? "javascript"}
                        theme={dracula}
                        showLineNumbers={true}
                      />
                    </div>
                  </div>
                ) : (*/}
                  <div
                    className={`rounded-2xl px-4 py-3 shadow-sm ${
                      isUser
                        ? 'bg-primary text-primary-foreground ml-4'
                        : 'bg-card border mr-4'
                    }`}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                {/*)*/}

                {/* Message metadata */}
                <div className={`mt-1 text-xs text-muted-foreground ${isUser ? 'text-right mr-4' : 'text-left ml-4'}`}>
                  {msg.role === 'assistant' && msg.tokensPerSecond && (
                    <span>{msg.tokensPerSecond.toFixed(1)} tok/s</span>
                  )}
                  {msg.partial && <span className="animate-pulse"> • Generating...</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
