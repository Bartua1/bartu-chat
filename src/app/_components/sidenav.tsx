// SideNav.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useUser, UserButton, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RiChatNewLine, RiDeleteBinLine } from "react-icons/ri";
import { Button } from "~/components/ui/button";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarProvider,
} from "~/components/ui/sidebar";
import {
  Card,
  CardContent,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  LogOut,
  Bell,
  CreditCard,
  User,
  Crown,
  SquareTerminal,
  Settings2,
  BotMessageSquare,
} from "lucide-react";
import {
  useChat
} from './chat-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog"
import { NavMain } from "~/app/_components/nav-main"

export function SideNav() {
  const {
    user,
    isLoaded
  } = useUser();
  const router = useRouter();
  const {
    signOut,
    // isLoaded,
    // isSignedIn,
    // user,
  } = useClerk();
  const {
    chats,
    removeChat
  } = useChat(); // Access chats from context

  const handleNewChatClick = () => {
    router.push('/');
  };

  const [navData, setNavData] = useState<{ navMain: { title: string; url: string; icon: React.ComponentType; isActive: boolean; items: { title: string, url: string }[] }[] }>({
    navMain: [
      {
        "title": "Chats",
        "url": "/",
        "icon": BotMessageSquare,
        "isActive": true,
        "items": []
      }
    ]
  });

  useEffect(() => {
    // Update the navData when chats change
    const updatedNavData = {
      navMain: [
        {
          "title": "Chats",
          "url": "/",
          "icon": BotMessageSquare,
          "isActive": true,
          "items": chats.map((chat) => ({
            title: chat.name,
            url: `/${chat.url}` // Use chat.id here
          }))
        },
        {
          "title": "Settings",
          "url": "/",
          "icon": Settings2,
          "items": [
            {
              title: "General",
              url: "#",
            },
            {
              title: "Chat history",
              url: "#",
            },
            {
              title: "Team",
              url: "#",
            },
            {
              title: "Billing",
              url: "#",
            },
            {
              title: "Limits",
              url: "#",
            },
          ]
        }
      ]
    };
    setNavData(updatedNavData);
  }, [chats]); // Dependency array ensures this runs when chats update



  const handleLogout = () => {
    // Implement logout functionality here
    console.log("Logging out...");
    // You might want to use Clerk's signOut method here
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Failed to delete chat:', response.status, response.statusText);
        // Optionally show an error message to the user
        return;
      }

      // Optimistically update the UI
      removeChat(chatId);
    } catch (error) {
      console.error('Error deleting chat:', error);
      // Optionally show an error message to the user
    }
  };

  return (
    <Sidebar className="h-screen border-r">
      <SidebarHeader className="p-4">
        <div className="text-2xl font-bold">
          Bartu Chat
        </div>
        <Button variant="outline"
          className="w-full justify-start mt-2"
          onClick={handleNewChatClick}>
          <RiChatNewLine className="mr-2 h-4 w-4" />
          Start new chat
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-1">
        <ScrollArea className="h-[calc(100vh-16rem)]">
          {/* Use NavMain here */}
          <NavMain items={navData.navMain} />


          {chats.length > 0 && ( // Only render the delete buttons when there are chats
          <div className="space-y-1">
              {chats.map((chat) => (
                <div key={chat.id} className="relative group">
                  <div className="absolute top-0 right-0 h-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-red-500 hover:text-white"
                        >
                          <RiDeleteBinLine className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete
                            the chat and remove your access to it.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteChat(chat.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Separator className="my-2" />
        {isLoaded && user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Card className="cursor-pointer hover:bg-muted transition-colors">
                <CardContent className="p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {user.imageUrl && (
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <img src={user.imageUrl}
                          alt={user.username || "User"}
                          className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">
                        {user.username || "User"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Free plan
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img src={user.imageUrl}
                    alt={user.username || "User"}
                    className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {user.username}
                  </span>
                  <span className="text-xs text-muted-foreground"> Free plan </span>
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem className="cursor-pointer">
                <Crown className="mr-2 h-4 w-4" />
                <span> Upgrade to Pro </span>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span> Account </span>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                <span> Billing </span>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer">
                <Bell className="mr-2 h-4 w-4" />
                <span> Notifications </span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem className="cursor-pointer"
                onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span onClick={() => signOut({ redirectUrl: '/' })}> Log out </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {!isLoaded && (
          <div className="text-center p-2"> Loading... </div>
        )}

        {isLoaded && !user && (
          <Card>
            <CardContent className="p-2">
              <div className="font-semibold"> Not Signed In </div>
            </CardContent>
          </Card>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}