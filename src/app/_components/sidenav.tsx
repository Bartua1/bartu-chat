'use client';
import React, { useState, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RiChatNewLine } from "react-icons/ri";
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
  Crown
} from "lucide-react";

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
  const router = useRouter();

  useEffect(() => {
    async function loadChats() {
      if (!isLoaded || !user) {
        setIsLoading(false);
        return;
      }
      try {
        const currentUserId = user.id;
        console.log("Current user ID:", currentUserId);
        
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

  const handleNewChatClick = () => {
    router.push('/');
  };

  const handleLogout = () => {
    // Implement logout functionality here
    console.log("Logging out...");
    // You might want to use Clerk's signOut method here
  };

  return (
    <SidebarProvider>
      <Sidebar className="h-screen border-r">
        <SidebarHeader className="p-4">
          <div className="text-2xl font-bold">Bartu Chat</div>
          <Button 
            variant="outline" 
            className="w-full justify-start mt-2" 
            onClick={handleNewChatClick}
          >
            <RiChatNewLine className="mr-2 h-4 w-4" />
            Start new chat
          </Button>
        </SidebarHeader>

        <SidebarContent className="px-3">
          <div className="text-sm font-semibold text-muted-foreground py-2">
            Chats
          </div>
          <ScrollArea className="h-[calc(100vh-16rem)]">
            {isLoading ? (
              <div className="text-muted-foreground py-2">Loading chats...</div>
            ) : chats.length > 0 ? (
              <div className="space-y-1">
                {chats.map((chat) => (
                  <Button
                    key={chat.id}
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href={`/${chat.url}`}>
                      {chat.name}
                    </Link>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground py-2">
                Start a new chat to see it here!
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
                          <img 
                            src={user.imageUrl} 
                            alt={user.username || "User"} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold">{user.username || "User"}</div>
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
                  <div className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 w-8 h-8 flex items-center justify-center text-white font-medium">
                    {user.username?.[0] ?? "U"}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold">{user.username}</span>
                    <span className="text-xs text-muted-foreground">{user.emailAddresses?.[0]?.emailAddress ?? ""}</span>
                  </div>
                </div>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem className="cursor-pointer">
                  <Crown className="mr-2 h-4 w-4" />
                  <span>Upgrade to Pro</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Account</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Billing</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="cursor-pointer">
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {!isLoaded && (
            <div className="text-center p-2">Loading...</div>
          )}
          
          {isLoaded && !user && (
            <Card>
              <CardContent className="p-2">
                <div className="font-semibold">Not Signed In</div>
              </CardContent>
            </Card>
          )}
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}