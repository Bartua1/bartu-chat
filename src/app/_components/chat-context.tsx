// chat-context.tsx
'use client';
import React, {
    createContext,
    useState,
    useEffect,
    useContext,
    ReactNode
} from 'react';
import {
    useUser
} from '@clerk/nextjs';

interface Chat {
    id: number;
    name: string;
    userId: string;
    url: string;
}

interface ChatContextType {
    chats: Chat[];
    addChat: (newChat: Chat) => void;
    removeChat: (chatId: number) => Promise<void>;
    fetchChats: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
    children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
    children
}) => {
    const {
        user,
        isLoaded
    } = useUser();
    const [chats, setChats] = useState < Chat[] > ([]);
    const [isLoading, setIsLoading] = useState(true); // Add loading state

    useEffect(() => {
        async function loadChats() {
            if (!isLoaded || !user) {
                setIsLoading(false);
                return;
            }
            try {
                const currentUserId = user.id;
                const response = await fetch(`/api/users/${currentUserId}/chats`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = (await response.json()) as Chat[];
                const userChats = data.filter(chat => chat.userId === currentUserId);
                setChats(userChats);
            } catch (error) {
                console.error("Failed to fetch chats:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadChats();
    }, [user, isLoaded]);


    const addChat = (newChat: Chat) => {
        setChats((prevChats) => [...prevChats, newChat]);
    };


    const removeChat = async (chatId: number) => {
        try {
            const response = await fetch(`/api/chats/${chatId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));

        } catch (error) {
            console.error("Failed to remove chat:", error);
        }
    };


    const fetchChats = async () => {
        if (!isLoaded || !user) {
            return;
        }
        try {
            const currentUserId = user.id;
            const response = await fetch(`/api/users/${currentUserId}/chats`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = (await response.json()) as Chat[];
            const userChats = data.filter(chat => chat.userId === currentUserId);
            setChats(userChats);
        } catch (error) {
            console.error("Failed to fetch chats:", error);
        }
    };

    const value: ChatContextType = {
        chats,
        addChat,
        removeChat,
        fetchChats
    };

    return (
        <ChatContext.Provider value = { value } >
            {
                children
            }
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};