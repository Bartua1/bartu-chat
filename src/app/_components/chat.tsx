'use client';
// ChatComponent.jsx
import { useState, useEffect, useRef } from 'react';
import { FaFileUpload, FaPlay, FaImage } from 'react-icons/fa'; // Import file upload and run icons
import { IoAddCircleSharp } from "react-icons/io5";
import { OpenAI } from 'openai';
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
  thinking?: string | null; // Added thinking to the Message interface
}

export function ChatComponent() {
  const { user, isLoaded } = useUser();
  const { userId } = useAuth();
  const params = useParams();
  const chatUrlFromParams = params.chatUrl;
  const [newChat, setNewChat] = useState(true);
  const [chatName, setChatName] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]); // Initialize as empty array
  const [client, setClient] = useState(null);
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

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast: useToastHook } = useToast();
  const { addChat, fetchChats } = useChat(); // Get the addChat function


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
  }, [systemInstructions]); // Re-run when systemInstructions change

  useEffect(() => {
    const fetchOpenAIUrl = async () => {
      const response = await fetch('/api/apis/openai/apis');
      const data = await response.json();
      const openAIUrl = data.openai;

      const clientInstance = new OpenAI({
        baseURL: openAIUrl,
        apiKey: "dummy",
        dangerouslyAllowBrowser: true
      });

      setClient(clientInstance);

      setLoadingModels(true);
      setModelError(null);

      try {
        const response = await clientInstance.models.list();
        const data = response.data;

        if (data && Array.isArray(data)) {
          setModels(data);
          if (data.length > 0) {
            setSelectedModel(data[0]?.id ?? '');
          }
        } else {
          throw new Error("Invalid response format from /v1/models");
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Could not fetch models:", error);
        useToastHook({
          title: "Error fetching models",
          description: errorMessage,
          variant: "destructive",
        })
        setModelError(errorMessage);
      } finally {
        setLoadingModels(false);
      }
    };

    void fetchOpenAIUrl();
  }, []);

  const extractThinking = (content: string): { thinking: string | null; answer: string } => {
    const thinkingMatches = [...content.matchAll(/<(think|thought|thinking)>(.*?)<\/(think|thought|thinking)>/gi)];
    const thinking = thinkingMatches.map(match => match[2] ?? '').join("\n");
    const answer = content.replace(/<(think|thought|thinking)>.*?<\/(think|thought|thinking)>/gi, '').trim();
    return { thinking: thinking || null, answer };
  };

  useEffect(() => {
    const loadPreviousMessages = async () => {
      if (chatUrlFromParams) {
        setLoadingResponse(true);
        setNewChat(false);
        if (chatUrlFromParams) {
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
            })
            setResponseError(errorMessage);
          } finally {
            setLoadingResponse(false);
          }
        } else {
          console.error("Could not extract chatId from URL:", chatUrlFromParams);
          useToastHook({
            title: "Error extracting chatId from URL",
            description: "Invalid chat URL",
            variant: "destructive",
          })
          setResponseError("Invalid chat URL");
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

  const uploadMessage = async (chatUrl: string, model: string, userId: string, content: string, sender: string) => {
    try {
      const response = await fetch('/api/uploadmessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatUrl, model, userId, content, sender }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Message uploaded successfully:', data);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Could not upload message:", error);
      useToastHook({
        title: "Error uploading message",
        description: errorMessage,
        variant: "destructive",
      })
      setResponseError(errorMessage);
    }
  };


  const handleSendMessage = async () => {
    if (message.trim() !== '') {
      let currentChatId: string | null = chatId; // Capture chatId value immediately
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
            if (!client) {
              throw new Error("OpenAI client is not initialized.");
            }
            const titleResponse = await client.chat.completions.create({
              model: selectedModel ?? models[0]?.id ?? "deepseek-coder-v2-lite-instruct",
              messages: [{ role: 'user', content: message }, { role: 'user', content: "Suggest a concise, 6-word title for this conversation. Return only the title, with no additional explanation or preamble." }],
              max_tokens: 10,
            });

            const title = titleResponse.choices[0]?.message?.content ?? `chat - ${new Date().toISOString()}`;
            setChatName(title);

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

            // **Add the new chat to the context:**
            const newChatObject = {
              id: Date.now(), // Or get ID from the `chat` response if your API returns it
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
            })
            setResponseError(errorMessage);
            setLoadingResponse(false);
            return;
          }
        } else {
          currentChatId = chatId ?? (typeof chatUrlFromParams === 'string' ? chatUrlFromParams : null); // Directly use chatUrlFromParams

          if (!currentChatId) {
            console.error("Chat ID is null or undefined.");
            return;
          }
        }

        setResponseError(null);
        setStartTime(null);
        setTotalTokens(0);
        setTokensPerSecond(0);

        // Include system prompt at the start of the messages array
        const messagesForApi = [{ role: 'system', content: systemInstructions }, ...messages.slice(1), userMessage];

        if (currentChatId) {
          console.log(`uploadMessage - currentChatId: ${currentChatId}, selectedModel: ${selectedModel ?? models[0]?.id ?? "deepseek-coder-v2-lite-instruct"}, userId: ${userId!}, message: ${message}`);
          await uploadMessage(currentChatId, selectedModel ?? models[0]?.id ?? "deepseek-coder-v2-lite-instruct", userId!, message, 'user');
          console.log("uploadMessage call finished for user message"); // Add this line
        } else {
          console.error("Error uploading user message: Chat URL is null. Current Chat URL: ", currentChatId);
        }

        const response = await client.chat.completions.create({
          model: selectedModel ?? models[0]?.id ?? "deepseek-coder-v2-lite-instruct",
          messages: messagesForApi,
          stream: true,
        });

        let fullReply = "";
        let currentTokenCount = 0;
        let assistantThinking = null;
        let tps = 0; // Initialize tps here

        setLoadingResponse(true);

        for await (const chunk of response) {
          if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) {
            const text = chunk.choices[0].delta.content;
            fullReply += text;
            currentTokenCount += 1;
            setTotalTokens(prevTotalTokens => prevTotalTokens + 1);

            if (startTime) {
              const elapsedTime = (Date.now() - startTime) / 1000;
              tps = currentTokenCount / elapsedTime;
              setTokensPerSecond(tps);
            }

            const { thinking, answer } = extractThinking(fullReply);
            assistantThinking = thinking; // Update extracted thinking
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

        // Upload the full reply *after* the streaming is complete and the state is updated
        if (currentChatId) {
          console.log(`uploadMessage - currentChatId: ${currentChatId}, selectedModel: ${selectedModel ?? models[0]?.id ?? "deepseek-coder-v2-lite-instruct"}, userId: ${userId!}, fullReply: ${fullReply}`);
          await uploadMessage(currentChatId, selectedModel ?? models[0]?.id ?? "deepseek-coder-v2-lite-instruct", userId!, fullReply, 'assistant');
          console.log("uploadMessage call finished for assistant message");
        } else {
          console.error("Error uploading assistant message: Chat URL is null. Current Chat URL: ", currentChatId);
        }


      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Could not send message:", error);
        useToastHook({
          title: "Error sending message",
          description: errorMessage,
          variant: "destructive",
        })
        setResponseError(errorMessage);
        const errorMessageObj: Message = { role: 'assistant', content: "Error: " + errorMessage };
        setMessages(prevMessages => [...prevMessages, errorMessageObj]);
      } finally {
        setLoadingResponse(false);
        setStartTime(null);
      }
    }
  };

  const handleFileUpload = () => {
    console.log('File upload functionality to be implemented');
    toast.info("File upload functionality to be implemented")
  };

  const handleImageUpload = () => {
    console.log('Image upload functionality to be implemented');
    toast.info("Image upload functionality to be implemented");
  };

  const extractChatIdFromUrl = (url: string): string | null => {
    const parts = url.split('/');
    if (parts.length > 1 && parts[1] === 'chat') {
      return parts[2];
    }
    return null;
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
                  <Badge
                    variant={isUser ? "secondary" : "default"}
                    className={`inline-block p-2 rounded-md ${isUser ? 'bg-secondary text-secondary-foreground' : 'bg-slate-700 text-slate-200 text-sm'}`}
                  >
                    {msg.content}
                  </Badge>

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