import { useState } from 'react';
import { FaFileUpload, FaPlay, FaImage, FaFile, FaTimes } from 'react-icons/fa';
import { IoAddCircleSharp } from "react-icons/io5";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { useChat } from './chat-context';
import { ModelSelector } from './models/model-selector';

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
  object: string;
  created: number;
  owned_by: string;
  provider: string;
  displayName?: string;
  tags?: string[];
}

interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  attachments: Attachment[];
  setAttachments: (attachments: Attachment[]) => void;
  loadingResponse: boolean;
  handleSendMessage: () => Promise<void>;
  handleFileUpload: () => void;
  previewAttachment: (attachment: Attachment) => void;
  removeAttachment: (id: number) => void;
  loadingModels: boolean;
  modelError: string | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedModel: string;
  setSelectedModel: (selectedModel: string) => void;
  models: Model[];
  favoriteModels: string[];
  toggleFavoriteModel: (modelId: string) => Promise<void>;
  handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => Promise<void>;
}

export function ChatInput({
  message,
  setMessage,
  attachments,
  setAttachments,
  loadingResponse,
  handleSendMessage,
  handleFileUpload,
  previewAttachment,
  removeAttachment,
  loadingModels,
  modelError,
  open,
  setOpen,
  selectedModel,
  setSelectedModel,
  models,
  favoriteModels,
  toggleFavoriteModel,
  handlePaste,
}: ChatInputProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-1 bg-muted/80 backdrop-blur rounded-lg px-3 py-2 text-xs cursor-pointer hover:bg-muted/90 transition-colors border border-border/50"
                  onClick={() => previewAttachment(attachment)}
                >
                  <FaFile className="h-3 w-3" />
                  <span className="truncate max-w-[100px]">{attachment.fileName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      previewAttachment(attachment);
                    }}
                    title="Preview file"
                  >
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAttachment(attachment.id);
                    }}
                    title="Remove attachment"
                  >
                    <FaTimes className="h-2 w-2" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Input Container - Floating with Enhanced Backdrop */}
        <div className="border border-border/50 rounded-2xl bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-xl p-3">
          <div className="flex items-end space-x-3">
            {/* Attachment Button */}
            <Button
              type="button"
              onClick={handleFileUpload}
              variant="ghost"
              size="sm"
              disabled={loadingResponse}
              className="h-10 w-10 p-0 hover:bg-muted/50 rounded-xl flex-shrink-0 text-3xl"
              title="Attach files (Images, PDFs, Word docs)"
            >
              📎
            </Button>
            
            {/* Input Area with Model Selection */}
            <div className="flex-1 relative">
              {/* Model Selection - Inside Input Area */}
              <div className="mb-2">
                <ModelSelector
                  loadingModels={loadingModels}
                  modelError={modelError}
                  open={open}
                  setOpen={setOpen}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  models={models}
                  favoriteModels={favoriteModels}
                  toggleFavoriteModel={toggleFavoriteModel}
                />
              </div>
              
              {/* Text Input */}
              <Textarea
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onPaste={(e) => {
                  const pastedText = e.clipboardData.getData('text');
                  const lineCount = pastedText.split('\n').length;

                  if (lineCount > 50) {
                    e.preventDefault();
                    alert('Pasted content is too large. Please upload as a file.');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !loadingResponse) {
                    e.preventDefault();
                    void handleSendMessage();
                  }
                }}
                disabled={Boolean(loadingModels ?? modelError ?? loadingResponse)}
                className="min-h-[44px] max-h-32 resize-none bg-muted/20 border-border/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus-visible:ring-2 focus-visible:ring-primary/20 p-3"
                rows={1}
              />
            </div>
            
            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={loadingResponse || (!message.trim() && attachments.length === 0)}
              size="sm"
              className="h-10 w-10 p-0 rounded-xl flex-shrink-0"
            >
              {loadingResponse ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <FaPlay className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
