'use client';
// ChatComponent.jsx
import { useState, useEffect, useRef } from 'react';
import { FaFileUpload, FaPlay } from 'react-icons/fa'; // Import file upload and run icons
import { IoAddCircleSharp } from "react-icons/io5";
import { OpenAI } from 'openai';
import { useAuth } from '@clerk/nextjs';
import { useParams } from 'next/navigation';

export function ChatComponent() {
  const { userId } = useAuth();
  const params = useParams();
  const chatUrlFromParams = params.chatUrl; // Rename to chatUrlFromParams to reflect its actual value
  const [newChat, setNewChat] = useState(true); // Initially true until chatId is present
  const [chatName, setChatName] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [systemInstructionsCollapsed, setSystemInstructionsCollapsed] = useState(true);
  const [message, setMessage] = useState('');

  interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
    partial?: boolean;
    tokensPerSecond?: number;
  }

  interface Model {
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }

  const [messages, setMessages] = useState<Message[]>([{ "role": "system", "content": "You are a helpful assistant." }]); // To store the conversation history, include the system prompt
  const [client, setClient] = useState<OpenAI | null>(null); // Define the client state
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loadingModels, setLoadingModels] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [tokensPerSecond, setTokensPerSecond] = useState(0); // Add state for tokens per second
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalTokens, setTotalTokens] = useState(0);

  const chatContainerRef = useRef<HTMLDivElement>(null); // Ref for the chat container to scroll to bottom

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
        setModelError(errorMessage);
      } finally {
        setLoadingModels(false);
      }
    };

    void fetchOpenAIUrl();
  }, []);

  // Load Previous Messages Effect
  useEffect(() => {
    const loadPreviousMessages = async () => {
      if (chatUrlFromParams) { // Use chatUrlFromParams here
        setLoadingResponse(true);
        setNewChat(false); // Set to false since it's not a new chat anymore
        if (chatUrlFromParams) {
            setChatId(chatUrlFromParams); // Update state with the extracted chatId (UUID)
            console.log("Loading previous messages for chatId:", chatUrlFromParams); // Log the chatId
            try {
              const response = await fetch(`/api/chats/${chatUrlFromParams}/messages`);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              const data = await response.json() as any[]; // Adjust type if needed

              // Transform the data from the API to the Message interface
              const formattedMessages = data.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant', // Use msg.sender
                content: msg.content,
              }));

              // Set the messages along with the default system message
              setMessages([{ role: 'system', content: "You are a helpful assistant." }, ...formattedMessages]);
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : "Unknown error";
              console.error("Failed to load previous messages:", error);
              setResponseError(errorMessage);
            } finally {
              setLoadingResponse(false);
            }
          } else {
            console.error("Could not extract chatId from URL:", chatUrlFromParams);
            setResponseError("Invalid chat URL");
            setLoadingResponse(false);
          }
      }
    };

    void loadPreviousMessages();
  }, [chatUrlFromParams]); // Dependency on chatUrlFromParams

  // useEffect to scroll to the bottom of the chat container when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const uploadMessage = async (chatUrl: string, model: string, userId: string, content: string, sender: string) => {
    try {
      // console.log(`Uploading message to chatId: ${chatUrl}, sender: ${sender}`);
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

      // Optionally handle response data from the API
      const data = await response.json();
      console.log('Message uploaded successfully:', data);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Could not upload message:", error);
      setResponseError(errorMessage); // Or handle the error differently
    }
  };

  const handleSendMessage = async () => {
    if (message.trim() !== '') {
      try {
        const userMessage: Message = { role: 'user', content: message };
        setMessages(prevMessages => [...prevMessages, userMessage]);
        setMessage('');
        setLoadingResponse(true);

        let currentChatId: string | null = chatId;

        if (newChat && !chatUrlFromParams) {  // newChat is true and there is no chatUrl in URL
          try {
            // Ask the model for a chat name
            if (!client) {
              throw new Error("OpenAI client is not initialized.");
            }
            const titleResponse = await client.chat.completions.create({
              model: selectedModel || models[0]?.id || "deepseek-r1-distill-qwen-1.5b",
              messages: [{ role: 'user', content: message }, { role: 'user', content: "Return 6 words that could be the title of this conversion (nothing more)." }],
              max_tokens: 10,
            });

            const title = titleResponse.choices[0]?.message?.content ?? `chat - ${new Date().toISOString()}`;
            console.log("Generated title:", title);
            setChatName(title);

            // Create a new chat
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

            const chat = await response.json() as { id: string }; // Expect string id now (UUID)
            currentChatId = chat.id;
            setChatId(chat.id); // Store the chat ID
            setNewChat(false);
            console.log("New chat created with ID:", chat.id);


          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            console.error("Could not create chat:", error);
            setResponseError(errorMessage);
            setLoadingResponse(false);
            return;
          }
        } else {
            //  Extract chatId from URL
            currentChatId = chatId ?? (typeof chatUrlFromParams === 'string' ? extractChatIdFromUrl(chatUrlFromParams) : null);

            if (!currentChatId) {
              console.error("Chat ID is null or undefined.");
              return;
            }
        }

        console.log("Current Chat Url:", currentChatId); // Log the currentChatId before upload
        setResponseError(null);
        setStartTime(null);  // Reset start time for new response
        setTotalTokens(0); //Reset tokens
        setTokensPerSecond(0); // reset tokens per second

        // Prepare the full messages array for the OpenAI API
        const messagesForApi = [...messages, userMessage];

        // Upload the user message
        if (currentChatId) {
          await uploadMessage(currentChatId, selectedModel || models[0]?.id || "gpt-3.5-turbo", userId!, message, 'user');
        } else {
          console.error("Chat ID is null, cannot upload message.");
          return;
        }

        const response = await client.chat.completions.create({ // Use chat.completions.create
          model: selectedModel || models[0]?.id || "gpt-3.5-turbo",
          messages: messagesForApi,  // Send the full conversation history
          stream: true,
        });

        let fullReply = "";
        let currentTokenCount = 0;

        setLoadingResponse(true);  // Ensure loading is set at the beginning

        for await (const chunk of response) { // Iterate over the stream
          if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) {
            const text = chunk.choices[0].delta.content;
            fullReply += text;
            currentTokenCount += 1; // Increment token count for each chunk processed
            setTotalTokens(prevTotalTokens => prevTotalTokens + 1);

            // Calculate tokens per second
            if (startTime) {
              const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
              const tps = currentTokenCount / elapsedTime;
              setTokensPerSecond(tps);
            } else {
              setStartTime(Date.now()); // Set start time when first token arrives
            }

            setMessages(prevMessages => {
              const lastMessage = prevMessages.length > 0 ? prevMessages[prevMessages.length - 1] : null;
              if (lastMessage && lastMessage.role === 'assistant' && lastMessage.partial) { //Use role instead of sender
                return prevMessages.map((msg, index) =>
                  index === prevMessages.length - 1
                    ? { ...msg, content: fullReply, partial: true, tokensPerSecond: tokensPerSecond } // Just update content
                    : msg
                );
              } else {
                const newMessage: Message = { role: 'assistant', content: fullReply, partial: true, tokensPerSecond: tokensPerSecond };
                return [...prevMessages, newMessage]; // Use role, content
              }
            });

          }
        }

        // Finalize the message to remove partial flag
        setMessages(prevMessages =>
          prevMessages.map(msg => (msg.role === 'assistant' && msg.partial ? { ...msg, partial: false, tokensPerSecond: tokensPerSecond } : msg)) //Use role
        );

        // Upload the assistant message
        if (currentChatId) {
          await uploadMessage(currentChatId, selectedModel || models[0]?.id || "gpt-3.5-turbo", userId!, fullReply, 'assistant');
        } else {
          console.error("Chat ID is null, cannot upload message.");
        }


      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Could not send message:", error);
        setResponseError(errorMessage);
        const errorMessageObj: Message = { role: 'assistant', content: "Error: " + errorMessage };
        setMessages(prevMessages => [...prevMessages, errorMessageObj]); //Use role
      } finally {
        setLoadingResponse(false);
        setStartTime(null); // Reset start time after response is complete
      }
    }
  };

  const handleFileUpload = () => {
    // Implement file upload logic here (e.g., using a file input element)
    console.log('File upload functionality to be implemented');
  };

    //  Helper function to extract chatId from URL.  Implement this based on your URL structure.
  const extractChatIdFromUrl = (url: string): string | null => {
    //  Example: Assuming the URL is something like "/chat/123456-7890-..."
    const parts = url.split('/');
    if (parts.length > 1 && parts[1] === 'chat') { //adjust this logic to match ur route
      return parts[2]; // returns the UUID if the URL is of /chat/UUID
    }
    return null;
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-slate-50 text-slate-900">
      {/* Top Bar */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSystemInstructionsCollapsed(!systemInstructionsCollapsed)}
            className="text-blue-500 hover:text-blue-700"
            title={systemInstructionsCollapsed ? 'Show System Instructions' : 'Hide System Instructions'}
          >
            {systemInstructionsCollapsed ? 'Show System Instructions' : 'Hide System Instructions'}
          </button>
        </div>
        {!systemInstructionsCollapsed && (
          <div className="mt-2 p-2 bg-white rounded border border-gray-300 shadow-sm">
            <p className="text-sm text-gray-700">
              These are the system instructions that guide the conversation. You can customize them to influence the bot's behavior.
              (Example: You are a helpful assistant. Keep your responses concise.)
            </p>
          </div>
        )}
      </div>

      {/* Middle Section (Welcome message or Conversation History) */}
      <div className="flex-grow p-4 overflow-y-auto bg-slate-50" ref={chatContainerRef}> {/* Added ref here */}
        {newChat && messages.length === 1 && ( // show only if it's a new chat AND there is only the system message
          <div className="text-center text-gray-500 align-middle flex items-center justify-center h-full text-2xl">
            <p>Welcome to Bartu-chat! Start a new conversation by typing a message below.</p>
          </div>
        )}

        {/* Conversation History */}
        {messages.slice(1).map((msg, index) => { // Skip system message in display
          const isUser = msg.role === 'user';
          return (
            <div key={index} className={`mb-2 ${isUser ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-2 rounded-lg ${isUser ? 'bg-blue-100' : 'bg-gray-100 text-slate-800'}`}>
                {msg.content}

              </div>
              {msg.role === 'assistant' && (
                <div className="text-xs text-gray-500 text-left">
                  {msg.tokensPerSecond ? `${msg.tokensPerSecond.toFixed(2)} tokens/s` : ''}
                </div>
              )}
            </div>
          );
        })}

        {loadingResponse && (
          <div className="text-left">
            <div className="inline-block p-2 rounded-lg bg-gray-100 text-slate-800">
              Thinking...
            </div>
          </div>
        )}

        {responseError && (
          <div className="text-left">
            <div className="inline-block p-2 rounded-lg bg-red-100 text-red-500 text-slate-800">
              Error: {responseError}
            </div>
          </div>
        )}

      </div>

      {/* Bottom Bar (Input area) */}
      <div className="bg-white p-4 border-t border-gray-200">

        {/* Model Selection Dropdown */}
        {loadingModels && <p className="text-gray-500">Loading models...</p>}
        {modelError && <p className="text-red-500">Error: {modelError}</p>}

        {!loadingModels && !modelError && (
          <div className="mb-2">
            <label htmlFor="modelSelect" className="block text-sm font-medium text-gray-700">Select Model:</label>
            <select
              id="modelSelect"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm text-slate-900"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={Boolean(loadingModels || modelError || loadingResponse)} // Disable if loading or error or waiting for a response
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>{model.id}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center">
          <input
            type="text"
            placeholder="Type something..."
            className="flex-grow p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300 shadow-sm text-slate-900"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loadingResponse) { // Disable enter key if waiting for a response
                void handleSendMessage();
              }
            }}
            disabled={Boolean(loadingModels || modelError || loadingResponse)} // Disable input while loading or error or waiting for a response
          />
          <button
            onClick={handleFileUpload}
            className="ml-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded border border-gray-300 shadow-sm"
            disabled={loadingResponse} // Disable upload while waiting for a response
            title="Upload File"
          >
            <IoAddCircleSharp />
          </button>
          <button
            onClick={handleSendMessage}
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loadingResponse} // Disable send while waiting for a response
            title="Send Message"
          >
            <FaPlay />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatComponent;