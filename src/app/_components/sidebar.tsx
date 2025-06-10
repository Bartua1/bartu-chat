// src/app/_components/sidebar.tsx
'use client';

import React, { createContext, useContext, useState } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  toggleSidebar: () => void;
  isCompact: boolean;
  toggleCompact: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isCompact, setIsCompact] = useState(false);

  const toggleSidebar = () => setIsOpen(prev => !prev);
  const toggleCompact = () => setIsCompact(prev => !prev);

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar, isCompact, toggleCompact }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarInset: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOpen, isCompact } = useSidebar();

  const paddingClass = isOpen
    ? isCompact
      ? 'md:pl-16'
      : 'md:pl-64'
    : 'md:pl-0';

  return (
    <div className={`flex-1 transition-all duration-300 ${paddingClass}`}>
      {children}
    </div>
  );
};