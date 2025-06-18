'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import { ScrollArea } from "~/components/ui/scroll-area";
import { toast } from "sonner"; // Using sonner for consistent toasts

// Import the new components
import { AttachmentPreviewDialog } from './attachment-preview-dialog';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';

// Re-import interfaces used across components
interface Attachment {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  content?: string;
}

interface Model {
  id: string;
  name?: string; // Add name field from database
  object: string;
  created: number;
  owned_by: string;
  provider: string; // Add provider back as it's used in chat-input for icon lookup
  displayName?: string;
  tags?: string[];
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  partial?: boolean;
  tokensPerSecond?: number;
  thinking?: string | null;
  attachments?: Attachment[];
}

export function ChatComponent() {
  const { user } = useUser();
  const { userId } = useAuth();
  const params = useParams();
  const chatUrlFromParams = params.chatUrl;

  // --- State Variables ---
  const [newChat, setNewChat] = useState(true);
  const [chatId, setChatId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showPreview, setShowPreview] = useState<Attachment | null>(null);
  const [copiedAttachment, setCopiedAttachment] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Model selection state
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loadingModels, setLoadingModels] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [openModelPopover, setOpenModelPopover] = useState(false); // Renamed to avoid conflict

  // Chat response state
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [favoriteModels, setFavoriteModels] = useState<string[]>([]);

  // Internal state for streaming (not passed to children directly)
  const [startTime, setStartTime] = useState<number | null>(null);
  const streamingResponseReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  // --- Refs ---
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- Utility Functions ---
  const extractThinking = useCallback((content: string): { thinking: string | null; answer: string } => {
    const thinkingRegex = /<(think|thought|thinking)>([\s\S]*?)<\/(think|thought|thinking)>/gi;
    const thinkingMatches = content.match(thinkingRegex);

    if (!thinkingMatches) {
      return { thinking: null, answer: content };
    }

    let thinking = '';
    thinkingMatches.forEach(match => {
      const extractedContent = match.replace(/<(think|thought|thinking)>([\s\S]*?)<\/(think|thought|thinking)>/i, '$2');
      thinking += extractedContent + '\n';
    });

    let answer = content;
    thinkingMatches.forEach(match => {
      answer = answer.replace(match, '');
    });

    answer = answer.trim();
    thinking = thinking.trim();

    return {
      thinking: thinking.length > 0 ? thinking : null,
      answer
    };
  }, []); // useCallback for stable function reference

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(textArea);
        return copied;
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      return false;
    }
  }, []); // useCallback for stable function reference

  // --- Handlers for Child Components ---

  const handleCopyCode = useCallback(async (code: string) => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopiedCode(code);
      toast.success("Code copied to clipboard!");
      setTimeout(() => {
        setCopiedCode(null);
      }, 2000);
    } else {
      toast.error("Failed to copy code to clipboard.");
    }
  }, [copyToClipboard]);

  const handleFileUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.json,.js,.ts,.py,.html,.css,.xml,.yaml,.yml';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('messageId', '0'); // Temporary

      try {
        const response = await fetch('/api/attachments', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const attachment = await response.json() as Attachment;
          setAttachments(prev => [...prev, attachment]);
          toast.success(`File ${file.name} attached successfully`);
        } else {
          throw new Error('Failed to upload file');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error('Failed to upload file');
      }
    };
    input.click();
  }, []);

  const removeAttachment = useCallback((id: number) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  }, []);

  const previewAttachment = useCallback(async (attachment: Attachment) => {
    try {
      const response = await fetch(`/api/attachments/${attachment.id}/content`);
      if (response.ok) {
        const data = await response.json() as Attachment;
        setShowPreview({ ...attachment, content: data.content });
      } else {
        toast.error('Failed to load file preview');
      }
    } catch (error) {
      console.error('Error loading preview:', error);
      toast.error('Failed to load file preview');
    }
  }, []);

  const copyAttachmentContent = useCallback(async (attachment: Attachment) => {
    try {
      const response = await fetch(`/api/attachments/${attachment.id}/content`);
      if (response.ok) {
        const data = await response.json() as Attachment;
        if (data.content) {
          const success = await copyToClipboard(data.content);
          if (success) {
            setCopiedAttachment(attachment.id);
            toast.success(`Copied ${attachment.fileName} content to clipboard`);
            setTimeout(() => {
              setCopiedAttachment(null);
            }, 2000);
          } else {
            toast.error('Failed to copy to clipboard');
          }
        }
      } else {
        toast.error('Failed to load file content');
      }
    } catch (error) {
      console.error('Error copying attachment content:', error);
      toast.error('Failed to copy file content');
    }
  }, [copyToClipboard]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    const lineCount = pastedText.split('\n').length;

    if (lineCount > 50) {
      e.preventDefault();

      const uniqueId = Math.random().toString(36).substring(2, 15);
      const fileName = `pasted_text_${uniqueId}.txt`;
      const blob = new Blob([pastedText], { type: 'text/plain' });
      const file = new File([blob], fileName, { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);
      formData.append('messageId', '0');

      try {
        const response = await fetch('/api/attachments', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const attachment = await response.json() as Attachment;
          setAttachments(prev => [...prev, attachment]);
          toast.success(`Large text content (${lineCount} lines) saved as ${fileName}`);
        } else {
          throw new Error('Failed to save attachment');
        }
      } catch (error) {
        console.error('Error creating attachment:', error);
        toast.error('Failed to save large text content as attachment');
        // Fall back to normal paste behavior if attachment fails
        setMessage(prev => prev + pastedText);
      }
    }
  }, []);


  const toggleFavoriteModel = useCallback(async (modelId: string) => {
    try {
      const response = await fetch('/api/user-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: modelId }),
      });
      if (!response.ok) throw new Error('Failed to update favorite models');
      const data = await response.json() as { favoriteModels: string[] };
      setFavoriteModels(data.favoriteModels);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error('Error updating favorite models:', error);
      toast.error(errorMessage);
    }
  }, []);

  const processStream = useCallback(async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    let fullReply = "";
    let currentTokenCount = 0;
    
    setStartTime(Date.now());

    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsedData = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
              const content = parsedData.choices?.[0]?.delta?.content;
              if (content) {
                fullReply += content;
                currentTokenCount += 1;

                const elapsedTime = (Date.now() - (startTime ?? Date.now())) / 1000;
                const tps = currentTokenCount / elapsedTime;

                const { thinking, answer } = extractThinking(fullReply);
                setMessages(prevMessages => {
                  const lastMessage = prevMessages.length > 0 ? prevMessages[prevMessages.length - 1] : null;
                  if (lastMessage && lastMessage.role === 'assistant' && lastMessage.partial) {
                    return prevMessages.map((msg, index) =>
                      index === prevMessages.length - 1
                        ? { ...msg, content: answer, partial: true, tokensPerSecond: tps, thinking: thinking }
                        : msg
                    );
                  } else {
                    const newMessage: Message = { role: 'assistant', content: answer, partial: true, tokensPerSecond: tps, thinking: thinking };
                    return [...prevMessages, newMessage];
                  }
                });
              }
            } catch (err) {
              console.error("Error parsing stream data:", err);
            }
          }
        }
      }
      
      const { thinking: finalThinking, answer: finalAnswer } = extractThinking(fullReply);
      setMessages(prevMessages => {
        return prevMessages.map(msg => {
          if (msg.role === 'assistant' && msg.partial) {
            const finalElapsedTime = (Date.now() - (startTime ?? Date.now())) / 1000;
            const finalTps = currentTokenCount / (finalElapsedTime > 0 ? finalElapsedTime : 1);
            return { ...msg, content: finalAnswer, thinking: finalThinking, partial: false, tokensPerSecond: finalTps };
          }
          return msg;
        });
      });

      return fullReply;
    } catch (error) {
      console.error("Stream processing error:", error);
      throw error;
    }
  }, [extractThinking, startTime]);

  const handleSendMessage = useCallback(async () => {
    if ((!message.trim() && attachments.length === 0) || loadingResponse) return;

    let currentChatId: string | null = chatId;
    const userMessageContent = message;

    const userMessage: Message = { role: 'user', content: userMessageContent, attachments: [...attachments] };

    try {
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setMessage('');
      const currentAttachments = [...attachments];
      setAttachments([]);
      setLoadingResponse(true);
      setResponseError(null);

      // 1. Create new chat if applicable (with empty title initially)
      if (newChat && !chatUrlFromParams) {
        try {
          const tempTitle = "New Chat"; // Temporary title

          const chatResponse = await fetch('/api/uploadchat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: tempTitle, userId: userId }),
          });
          if (!chatResponse.ok) throw new Error(`Failed to create new chat: ${chatResponse.status}`);
          const chat = await chatResponse.json() as { url: string }[];
          currentChatId = chat[0]?.url ?? null;
          setChatId(currentChatId);
          setNewChat(false);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          console.error("Could not create chat:", error);
          setResponseError(errorMessage);
          setLoadingResponse(false);
          return;
        }
      } else {
        currentChatId = chatId ?? (typeof chatUrlFromParams === 'string' ? chatUrlFromParams : null);
        if (!currentChatId) {
          console.error("Chat ID is null or undefined.");
          setLoadingResponse(false);
          return;
        }
      }

      // Find the selected model to get its name
      const selectedModelData = models.find(model => model.id === selectedModel);
      const modelName = selectedModelData?.name ?? selectedModel; // Fallback to selectedModel if name not found

      // 2. Save user message to database
      if (currentChatId) {
        const attachmentIds = currentAttachments.map(att => att.id);
        await fetch('/api/uploadmessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatUrl: currentChatId,
            model: modelName, // Send model name instead of selectedModel
            userId: userId!,
            content: userMessageContent,
            sender: 'user',
            attachmentIds
          }),
        });
      }

      // 3. Get streaming response from server
      const streamResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [ ...messages.slice(1), userMessage ], // Pass only relevant messages for context
          model: modelName, // Send model name instead of selectedModel
          stream: true,
          attachments: currentAttachments,
        }),
      });

      if (!streamResponse.ok) throw new Error(`HTTP error! status: ${streamResponse.status}`);
      if (!streamResponse.body) throw new Error("Response body is null");

      const reader = streamResponse.body.getReader();
      streamingResponseReaderRef.current = reader; // Store reader in ref
      
      const fullReply = await processStream(reader); // Process the stream

      // 4. Save assistant message to database after stream completes
      if (currentChatId) {
        await fetch('/api/uploadmessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatUrl: currentChatId,
            model: modelName, // Send model name instead of selectedModel
            userId: userId!,
            content: fullReply,
            sender: 'assistant'
          }),
        });
      }

      // 5. Generate and update chat title after response (only for new chats, first exchange)
      if (currentChatId && messages.length <= 2) { // First message exchange (user + assistant)
        try {
          const titleResponse = await fetch('/api/generate-title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessageContent, model: modelName }), // Send model name instead of selectedModel
          });
          if (titleResponse.ok) {
            const titleData = await titleResponse.json() as { title?: string };
            const generatedTitle = titleData.title ?? `Chat - ${new Date().toLocaleDateString()}`;
            
            // Update the chat title in the database
            await fetch(`/api/chats/${currentChatId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: generatedTitle }),
            });
          }
        } catch (error) {
          console.error("Could not generate/update chat title:", error);
          // Don't throw error as this is not critical for chat functionality
        }
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Could not send message:", error);
      setResponseError(errorMessage);
      setMessages(prevMessages => {
        // Find if there's a partial assistant message and update it with the error
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.partial) {
          return prevMessages.map((msg, idx) =>
            idx === prevMessages.length - 1
              ? { ...msg, content: `Error: ${errorMessage}`, partial: false, thinking: null }
              : msg
          );
        }
        // Otherwise, add a new error message
        return [...prevMessages, { role: 'assistant', content: `Error: ${errorMessage}` }];
      });
    } finally {
      setLoadingResponse(false);
      setStartTime(null);
      streamingResponseReaderRef.current = null;
    }
  }, [message, attachments, loadingResponse, chatId, newChat, chatUrlFromParams, selectedModel, messages, userId, processStream, models]);


  // --- Effects ---

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup streaming response reader on unmount
  useEffect(() => {
    return () => {
      if (streamingResponseReaderRef.current) {
        void streamingResponseReaderRef.current.cancel("Component unmounted or operation cancelled");
      }
    };
  }, []);

  // Fetch favorite models
  useEffect(() => {
    const fetchFavoriteModels = async () => {
      if (!userId) return;
      try {
        const response = await fetch('/api/user-models');
        if (!response.ok) throw new Error('Failed to fetch favorite models');
        const data = await response.json() as { favoriteModels: string[] };
        setFavoriteModels(data.favoriteModels);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error('Error fetching favorite models:', error);
        toast.error(errorMessage);
      }
    };
    void fetchFavoriteModels();
  }, [userId]);


  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      setLoadingModels(true);
      setModelError(null);
      try {
        const response = await fetch('/api/models');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json() as Model[];
        if (data && Array.isArray(data)) {
          const modelsWithProvider = data.map(model => ({
            ...model,
            provider: model.provider || 'unknown'
          }));
          setModels(modelsWithProvider);
          if (modelsWithProvider.length > 0 && !selectedModel) {
            setSelectedModel(modelsWithProvider[0]?.id ?? '');
          }
        } else {
          throw new Error("Invalid response format from /api/models");
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Could not fetch models:", error);
        setModelError(errorMessage);
      } finally {
        setLoadingModels(false);
      }
    };
    void fetchModels();
  }, [selectedModel]); // Re-fetch if selectedModel changes (though usually just once)

  // Load previous messages for existing chats
  useEffect(() => {
    const loadPreviousMessages = async () => {
      if (chatUrlFromParams && typeof chatUrlFromParams === 'string') {
        setLoadingResponse(true);
        setNewChat(false);
        setChatId(chatUrlFromParams);

        try {
          const response = await fetch(`/api/chats/${chatUrlFromParams}/messages`);
          if (!response.ok) {
            console.error("Error fetching messages:", response.status, response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json() as { content: string; sender: 'user' | 'assistant' }[];

          const formattedMessages: Message[] = data.map(msg => {
            const { thinking, answer } = extractThinking(msg.content);
            return {
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: answer,
              thinking: thinking,
            };
          });
          setMessages(formattedMessages);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          console.error("Could not load messages:", error);
          setResponseError(errorMessage);
          toast.error(`Failed to load chat history: ${errorMessage}`);
        } finally {
          setLoadingResponse(false);
        }
      } else {
        // For a brand new chat, initialize with an empty array
        setMessages([]);
      }
    };
    void loadPreviousMessages();
  }, [chatUrlFromParams, extractThinking]);


  return (
    <div className="relative flex flex-col h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Chat Background - Full Screen */}
      <div className="absolute inset-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div ref={chatContainerRef} className="p-4 space-y-6 pb-32">
            {newChat && messages.length === 0 && ( // Display initial message only for truly new, empty chats
              <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center space-y-4">
                  <div className="text-6xl">💬</div>
                  <h2 className="text-2xl font-semibold">Hey {user?.firstName ?? "there"}!</h2>
                  <p className="text-muted-foreground text-lg">What would you like to chat about today?</p>
                </div>
              </div>
            )}

            <ChatMessage
              messages={messages}
              previewAttachment={previewAttachment}
              handleCopyCode={handleCopyCode}
              copiedCode={copiedCode}
            />

            {/* Loading state */}
            {loadingResponse && (
              <div className="flex justify-start">
                <div className="bg-card border rounded-2xl px-4 py-3 mr-4 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error state */}
            {responseError && (
              <div className="flex justify-start">
                <div className="bg-destructive/10 border border-destructive/20 rounded-2xl px-4 py-3 mr-4">
                  <p className="text-sm text-destructive">⚠️ {responseError}</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Floating Input Area - Fixed at Bottom */}
      {userId && (
        <ChatInput
          message={message}
          setMessage={setMessage}
          attachments={attachments}
          setAttachments={setAttachments}
          loadingResponse={loadingResponse}
          handleSendMessage={handleSendMessage}
          handleFileUpload={handleFileUpload}
          previewAttachment={previewAttachment}
          removeAttachment={removeAttachment}
          loadingModels={loadingModels}
          modelError={modelError}
          open={openModelPopover}
          setOpen={setOpenModelPopover}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          models={models}
          favoriteModels={favoriteModels}
          toggleFavoriteModel={toggleFavoriteModel}
          // Pass the handlePaste function to ChatInput
          handlePaste={handlePaste}
        />
      )}

      {/* File Preview Dialog */}
      <AttachmentPreviewDialog
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        copyAttachmentContent={copyAttachmentContent}
        copiedAttachment={copiedAttachment}
      />
    </div>
  );
}

export default ChatComponent;
