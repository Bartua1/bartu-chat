"use client";

import React, { useState, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation'; // Import useRouter
import Link from 'next/link';
import { Menu } from 'lucide-react'; // Hamburger Icon
import { X } from 'lucide-react'; // Close Icon

interface Chat {
  id: number;
  name: string;
  userId: string;
  url: string;
}

export function TopNav() { // Renamed to TopNav
  const { user, isLoaded } = useUser();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter(); // Initialize useRouter
  const [isMenuOpen, setIsMenuOpen] = useState(false); // For the mobile menu

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
    router.push('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-gray-100 shadow-md p-4 flex items-center justify-between TopNav"> {/*  flex and justify-between */}
      {/* Hamburger Menu Icon - visible only on mobile */}
      <button
        className="md:hidden focus:outline-none"
        onClick={toggleMenu}
        aria-label="Open Menu"
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />} {/* Changed from MenuIcon to Menu */}
      </button>

      {/* Logo/Brand */}
      <div className="text-2xl font-bold text-center flex-grow md:flex-grow-0">Bartu-chat</div>  {/*  flex-grow */}

      {/* Conditionally Rendered Mobile Menu - hidden by default, shown when isMenuOpen is true */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-gray-100 shadow-md z-10 overflow-y-auto ${
          isMenuOpen ? 'block' : 'hidden'
        }`}
      >
        <div className="flex flex-col p-4 space-y-4">
          {/* New Chat Button */}
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={handleNewChatClick}
          >
            Start new chat
          </button>

          {/* Chat List */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Chats</h2>
            <ul className="space-y-2">
              {isLoading ? (
                <li className="text-gray-500">Loading chats...</li>
              ) : chats.length > 0 ? (
                chats.map((chat) => (
                  <li key={chat.id} className="hover:bg-gray-100 text-slate-800 hover:text-slate-950 bg-white rounded-md p-2 cursor-pointer">
                    <Link href={`/${chat.url}`} onClick={() => setIsMenuOpen(false)}>{chat.name}</Link> {/* Close menu on link click */}
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
                <UserButton afterSignOutUrl="/" afterSignOut={()=> router.push("/")}/>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* UserButton for sign out on desktop - Always visible in this version, adjust as needed */}
      <div className="hidden md:block">
          {user && <UserButton afterSignOutUrl="/" afterSignOut={()=> router.push("/")} />}
      </div>
    </nav>
  );
}