'use client';
// ChatComponent.tsx
import { useState, useEffect, useRef } from 'react';
import { FaFileUpload, FaPlay, FaImage } from 'react-icons/fa';
import { IoAddCircleSharp } from "react-icons/io5";
import { useAuth, useUser } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Textarea } from "~/components/ui/textarea"
import { ScrollArea } from "~/components/ui/scroll-area"
import { Badge } from "~/components/ui/badge"
import { Skeleton } from "~/components/ui/skeleton"
import { useToast } from "~/hooks/use-toast"
import { toast } from "sonner"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "~/components/ui/command"

import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { useChat } from './chat-context'
import { CodeBlock, CopyBlock, dracula } from "react-code-blocks";
import { Copy, CheckCircle } from "lucide-react";

interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface StyleOption {
  value: string;
  label: string;
  description: string;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  partial?: boolean;
  tokensPerSecond?: number;
  thinking?: string | null;
}

export function ChatComponent() {
  const { user, isLoaded } = useUser();
  const { userId } = useAuth();
  const params = useParams();
  const chatUrlFromParams = params.chatUrl;
  const [newChat, setNewChat] = useState(true);
  const [chatName, setChatName] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loadingModels, setLoadingModels] = useState(true);
  const [modelError, setModelError] = useState(null);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [responseError, setResponseError] = useState(null);
  const [tokensPerSecond, setTokensPerSecond] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [systemInstructions, setSystemInstructions] = useState("You are a helpful assistant. Keep your responses concise.");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [streamingResponse, setStreamingResponse] = useState<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast: useToastHook } = useToast();
  const { addChat, fetchChats } = useChat();

  const styleOptions: StyleOption[] = [
    { value: "Normal", label: "Normal", description: "Default responses from Claude" },
    { value: "Concise", label: "Concise", description: "Brief and to-the-point" },
    { value: "Explanatory", label: "Explanatory", description: "Detailed and informative" },
    { value: "Formal", label: "Formal", description: "Professional and polite" },
  ];

  const [selectedStyle, setSelectedStyle] = useState(styleOptions[0].value);

  useEffect(() => {
    // Initialize the messages with the system instruction
    setMessages([{ role: 'system', content: systemInstructions }]);
  }, [systemInstructions]);

  useEffect(() => {
    const fetchModels = async () => {
      setLoadingModels(true);
      setModelError(null);

      try {
        const response = await fetch('/api/models');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data && Array.isArray(data)) {
          setModels(data);
          if (data.length > 0) {
            setSelectedModel(data[0]?.id ?? '');
          }
        } else {
          throw new Error("Invalid response format from /api/models");
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Could not fetch models:", error);
        useToastHook({
          title: "Error fetching models",
          description: errorMessage,
          variant: "destructive",
        });
        setModelError(errorMessage);
      } finally {
        setLoadingModels(false);
      }
    };

    void fetchModels();
  }, [useToastHook]);

  const extractThinking = (content: string): { thinking: string | null; answer: string } => {
    // Match any tag that looks like <think>, <thinking>, or <thought> (case insensitive)
    const thinkingRegex = /<(think|thought|thinking)>([\s\S]*?)<\/(think|thought|thinking)>/gi;
    
    // Get all thinking matches
    const thinkingMatches = content.match(thinkingRegex);
    
    // If no thinking tags found, return original content
    if (!thinkingMatches) {
      return { thinking: null, answer: content };
    }
    
    // Extract all thinking content
    let thinking = '';
    thinkingMatches.forEach(match => {
      // Get the content between the tags
      const extractedContent = match.replace(/<(think|thought|thinking)>([\s\S]*?)<\/(think|thought|thinking)>/i, '$2');
      thinking += extractedContent + '\n';
    });
    
    // Remove the thinking tags from the original content
    let answer = content;
    thinkingMatches.forEach(match => {
      answer = answer.replace(match, '');
    });
    
    // Trim any excess whitespace
    answer = answer.trim();
    thinking = thinking.trim();
    
    return { 
      thinking: thinking.length > 0 ? thinking : null, 
      answer 
    };
  };

  useEffect(() => {
    const loadPreviousMessages = async () => {
      if (chatUrlFromParams) {
        setLoadingResponse(true);
        setNewChat(false);
        setChatId(chatUrlFromParams);
        console.log("Loading previous messages for chatId:", chatUrlFromParams);
        
        try {
          const response = await fetch(`/api/chats/${chatUrlFromParams}/messages`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json() as any[];

          const formattedMessages = data.map(msg => {
            const { thinking, answer } = extractThinking(msg.content);
            return {
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: answer,
              thinking: thinking,
            };
          });

          // Load previous messages, keeping the system message
          setMessages([{ role: 'system', content: systemInstructions }, ...formattedMessages]);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          console.error("Failed to load previous messages:", error);
          useToastHook({
            title: "Error loading previous messages",
            description: errorMessage,
            variant: "destructive",
          });
          setResponseError(errorMessage);
        } finally {
          setLoadingResponse(false);
        }
      }
    };

    void loadPreviousMessages();
  }, [chatUrlFromParams, useToastHook, systemInstructions]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

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

  const handleFileUpload = () => {
    console.log('File upload functionality to be implemented');
    toast.info("File upload functionality to be implemented");
  };

  const handleImageUpload = () => {
    console.log('Image upload functionality to be implemented');
    toast.info("Image upload functionality to be implemented");
  };

  // Function to process the streaming response
  const processStream = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    let fullReply = "";
    let currentTokenCount = 0;
    let tps = 0;

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
              const parsedData = JSON.parse(data);
              if (parsedData.choices && parsedData.choices[0] && parsedData.choices[0].delta && parsedData.choices[0].delta.content) {
                const text = parsedData.choices[0].delta.content;
                fullReply += text;
                currentTokenCount += 1;
                setTotalTokens(prevTotalTokens => prevTotalTokens + 1);

                const elapsedTime = (Date.now() - startTime!) / 1000;
                tps = currentTokenCount / elapsedTime;
                setTokensPerSecond(tps);

                const { thinking, answer } = extractThinking(fullReply);
                setMessages(prevMessages => {
                  const lastMessage = prevMessages.length > 0 ? prevMessages[prevMessages.length - 1] : null;
                  if (lastMessage && lastMessage.role === 'assistant' && lastMessage.partial) {
                    // Update existing partial message
                    return prevMessages.map((msg, index) =>
                      index === prevMessages.length - 1
                        ? { ...msg, content: answer, partial: true, tokensPerSecond: tps, thinking: thinking }
                        : msg
                    );
                  } else {
                    // Add new partial message
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
      
      // After the loop, update the final message to be non-partial
      const { thinking: finalThinking, answer: finalAnswer } = extractThinking(fullReply);
      setMessages(prevMessages => {
        return prevMessages.map(msg => {
          if (msg.role === 'assistant' && msg.partial) {
            return { ...msg, content: finalAnswer, thinking: finalThinking, partial: false, tokensPerSecond: tps };
          }
          return msg;
        });
      });
      
      return fullReply;
    } catch (error) {
      console.error("Stream processing error:", error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (message.trim() !== '') {
      let currentChatId: string | null = chatId;
      let userMessageContent = message;

      if (selectedStyle && selectedStyle !== "Normal") {
        const styleDescription = styleOptions.find(option => option.value === selectedStyle)?.description || selectedStyle;
        userMessageContent += `\n\n Please respond in a ${selectedStyle.toLowerCase()} style. (${styleDescription})`;
      }

      const userMessage: Message = { role: 'user', content: userMessageContent };

      try {
        setMessages(prevMessages => [...prevMessages, userMessage]);
        setMessage('');
        setLoadingResponse(true);

        if (newChat && !chatUrlFromParams) {
          try {
            // Generate title for new chat on the server
            const titleResponse = await fetch('/api/generate-title', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                message: message,
                model: selectedModel
              }),
            });

            if (!titleResponse.ok) {
              throw new Error(`HTTP error! status: ${titleResponse.status}`);
            }

            const titleData = await titleResponse.json();
            const title = titleData.title ?? `chat - ${new Date().toISOString()}`;
            setChatName(title);

            // Create new chat on the server
            const response = await fetch('/api/uploadchat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ name: title, userId: userId }),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const chat = await response.json() as { url: string }[];
            currentChatId = chat[0].url;
            setChatId(currentChatId);
            setNewChat(false);

            // Add the new chat to the context
            const newChatObject = {
              id: Date.now(),
              name: title,
              userId: userId!,
              url: currentChatId
            };

            addChat(newChatObject);
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            console.error("Could not create chat:", error);
            useToastHook({
              title: "Error creating chat",
              description: errorMessage,
              variant: "destructive",
            });
            setResponseError(errorMessage);
            setLoadingResponse(false);
            return;
          }
        } else {
          currentChatId = chatId ?? (typeof chatUrlFromParams === 'string' ? chatUrlFromParams : null);

          if (!currentChatId) {
            console.error("Chat ID is null or undefined.");
            return;
          }
        }

        setResponseError(null);
        setStartTime(null);
        setTotalTokens(0);
        setTokensPerSecond(0);

        // Save user message to database
        if (currentChatId) {
          await fetch('/api/uploadmessage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              chatUrl: currentChatId, 
              model: selectedModel, 
              userId: userId!, 
              content: message, 
              sender: 'user' 
            }),
          });
        }

        // Get streaming response from server
        const streamResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemInstructions },
              ...messages.slice(1),
              userMessage
            ],
            model: selectedModel,
            stream: true,
          }),
        });

        if (!streamResponse.ok) {
          throw new Error(`HTTP error! status: ${streamResponse.status}`);
        }

        if (!streamResponse.body) {
          throw new Error("Response body is null");
        }

        const reader = streamResponse.body.getReader();
        setStreamingResponse(reader);
        
        // Process the stream
        const fullReply = await processStream(reader);
        
        // After streaming is complete, save assistant message to database
        if (currentChatId) {
          await fetch('/api/uploadmessage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              chatUrl: currentChatId, 
              model: selectedModel, 
              userId: userId!, 
              content: fullReply, 
              sender: 'assistant' 
            }),
          });
        }

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Could not send message:", error);
        useToastHook({
          title: "Error sending message",
          description: errorMessage,
          variant: "destructive",
        });
        setResponseError(errorMessage);
        const errorMessageObj: Message = { role: 'assistant', content: "Error: " + errorMessage };
        setMessages(prevMessages => [...prevMessages, errorMessageObj]);
      } finally {
        setLoadingResponse(false);
        setStartTime(null);
        setStreamingResponse(null);
      }
    }
  };

  // Clean up the stream if component unmounts or user cancels
  useEffect(() => {
    return () => {
      if (streamingResponse) {
        streamingResponse.cancel("Component unmounted or operation cancelled");
      }
    };
  }, [streamingResponse]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedCode(code);
        setTimeout(() => {
          setCopiedCode(null); // Reset after a short delay
        }, 2000);
      })
      .catch(err => {
        console.error("Failed to copy code: ", err);
        useToastHook({
          title: "Error copying code",
          description: "Failed to copy code to clipboard.",
          variant: "destructive",
        });
      });
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top Bar */}
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="pb-2 flex flex-row justify-between items-center">
          <CardTitle>Chat</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <Collapsible className="border-slate-200 border p-4 rounded-md">
            <CollapsibleTrigger>
              <Label className='cursor-pointer' htmlFor="systemInstructions">System Instructions</Label>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-2">
              <Textarea
                id="systemInstructions"
                className="w-full"
                placeholder="Optional tone and style instructions for the model"
                onChange={(e) => setSystemInstructions(e.target.value)}
              />
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Middle Section (Conversation History) */}
      <div className="flex-grow">
        <ScrollArea className="h-full p-4">
          <div ref={chatContainerRef}>
            {newChat && messages.length === 1 && (
              <div className="text-center text-muted-foreground flex items-center justify-center h-full text-3xl">
                <p>Yo {user?.fullName ?? "test"}! Start chatting down below.</p>
              </div>
            )}

            {messages.slice(1).map((msg, index) => {
              const isUser = msg.role === 'user';
              const { code, language } = extractCode(msg.content);
              const isCodeResponse = msg.role === 'assistant' && code !== null;

              return (
                <div key={index} className={`mb-2 ${isUser ? 'text-right' : 'text-left'}`}>
                  {/* Thinking Section - Conditionally Rendered */}
                  {msg.role === 'assistant' && msg.thinking && (
                    <Collapsible className="mb-2">
                      <CollapsibleTrigger>
                        <Badge variant="secondary">Model is thinking...</Badge>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-2 text-sm text-muted-foreground">
                        {msg.thinking}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Main Message Content */}
                  {isCodeResponse ? (
                    <div className="relative">
                      <CodeBlock
                        text={code!} // code is guaranteed to be non-null here
                        language={language || "javascript"}
                        theme={dracula}
                        showLineNumbers={true}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                        onClick={() => handleCopyCode(code!)}
                      >
                        {copiedCode === code ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Badge
                      variant={isUser ? "secondary" : "default"}
                      className={`inline-block p-2 rounded-md ${isUser ? 'bg-secondary text-secondary-foreground' : 'bg-slate-700 text-slate-200 text-sm'}`}
                    >
                      {msg.content}
                    </Badge>
                  )}

                  {/* Tokens Per Second - Conditionally Rendered */}
                  {msg.role === 'assistant' && (
                    (msg.tokensPerSecond || msg.content) ? (
                      <>
                        {msg.tokensPerSecond ? `${msg.tokensPerSecond.toFixed(2)} tokens/s` : ''}
                      </>
                    ) : null
                  )}
                </div>
              );
            })}

            {loadingResponse && (
              <div className="text-left">
                <Badge variant="outline" className="inline-block p-2 rounded-md bg-slate-800 text-slate-200">
                  Thinking...
                </Badge>
              </div>
            )}

            {responseError && (
              <div className="text-left">
                <Badge variant="destructive" className="inline-block p-2 rounded-md bg-destructive text-destructive-foreground">
                  Error: {responseError}
                </Badge>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Bottom Bar (Input area) */}
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="p-4">
          {/* Model Selection Dropdown */}
          {loadingModels && (
            <div className="flex gap-2">
              <Skeleton className="h-4 w-[100px]" />
            </div>
          )}
          {modelError && <p className="text-red-500">{modelError}</p>}

          {!loadingModels && !modelError && (
            <div className="mb-4">
              <Label htmlFor="modelSelect">Select Model:</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    {selectedModel
                      ? models.find((model) => model.id === selectedModel)?.id
                      : "Select a model..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search model..." />
                    <CommandList>
                      <CommandEmpty>No model found.</CommandEmpty>
                      <CommandGroup>
                        {models.map((model) => (
                          <CommandItem
                            key={model.id}
                            value={model.id}
                            onSelect={(currentValue) => {
                              setSelectedModel(currentValue === selectedModel ? "" : currentValue)
                              setOpen(false)
                            }}
                          >
                            <Check
                              className="mr-2 h-4 w-4"
                              style={{ visibility: selectedModel === model.id ? 'visible' : 'hidden' }}
                            />
                            {model.id}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}
          {/* Choose Style Dropdown */}
          <div className="mb-4">
            <Label htmlFor="styleSelect">Choose Style:</Label>
            <Select onValueChange={setSelectedStyle}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a style" />
              </SelectTrigger>
              <SelectContent>
                {styleOptions.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="How can we help you today?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loadingResponse) {
                  void handleSendMessage();
                }
              }}
              disabled={Boolean(loadingModels ?? modelError ?? loadingResponse)}
              className="flex-grow" // Make input take available space
            />
            <Button
              type="button"
              onClick={handleFileUpload}
              variant="secondary"
              disabled={loadingResponse}
              title="Upload File"
            >
              <IoAddCircleSharp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              onClick={handleImageUpload}
              variant="secondary"
              disabled={loadingResponse}
              title="Upload Image"
            >
              <FaImage className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={loadingResponse}
              title="Send Message"
            >
              <FaPlay className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ChatComponent;