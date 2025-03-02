'use client';

import React, { useState, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation'; // Import useRouter
import Link from 'next/link';
import { RiChatNewLine } from "react-icons/ri";

interface Chat {
  id: number;
  name: string;
  userId: string;
  url: string;
}

export function SideNav() {
  const { user, isLoaded } = useUser();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    async function loadChats() {
      if (!isLoaded || !user) {
        setIsLoading(false);
        return;
      }

      try {
        // Get the current user's ID
        const currentUserId = user.id;
        console.log("Current user ID:", currentUserId);

        // Fetch chats from API
        const response = await fetch(`/api/users/${currentUserId}/chats`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = (await response.json()) as Chat[];

        // Filter chats to only include those belonging to the current user
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

  const handleNewChatClick = () => {
    //Navigate to a new chat page.  Could be a modal or a new route.
    router.push('/'); // Redirect to the '/new-chat' route
  };

  return (
    <nav className="flex flex-col h-screen bg-gray-100 shadow-md p-4 space-y-4 SideNav">
      {/* Logo/Brand */}
      <div className="text-2xl font-bold text-white">Bartu Chat</div>

      {/* New Chat Button */}
      <button
        className="text-left text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={handleNewChatClick}
      >
        <RiChatNewLine className="inline-block mr-2" />
        Start new chat
      </button>

      {/* Chat List */}
      <div className="flex-grow overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-400 mb-2">Chats</h2>
        <ul className="space-y-2">
          {isLoading ? (
            <li className="text-gray-500">Loading chats...</li>
          ) : chats.length > 0 ? (
            chats.map((chat) => (
                <li key={chat.id} className="text-slate-200 hover:text-white p-1">
                  <Link href={`/${chat.url}`} >{chat.name}</Link>
                </li>
            ))
          ) : (
            <li className="text-gray-500">Start a new chat to see it here!</li>
          )}
        </ul>
      </div>

      {/* User Info */}
      <div className="border-t border-gray-300 pt-4">
        <div className="flex items-center justify-between">
          <div>
            {isLoaded ? (
              user ? (
                <>
                  <div className="font-semibold text-white">{user.username}</div>
                  <div className="text-sm text-gray-500">Free Plan</div>
                </>
              ) : (
                <div className="font-semibold text-gray-800">Not Signed In</div>
              )
            ) : (
              <div className="font-semibold text-gray-800">Loading...</div>
            )}
          </div>
          {/* Optional User Avatar/Icon */}
          {user && user.imageUrl && (
            <UserButton/>
          )}
        </div>
      </div>
    </nav>
  );
}