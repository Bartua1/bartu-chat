import { useState } from 'react';
import { FaFile } from 'react-icons/fa';
import {
  Button,
} from "~/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { ScrollArea } from "~/components/ui/scroll-area"
import { CheckCircle, Copy } from "lucide-react";

interface Attachment {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  content?: string;
}

interface AttachmentPreviewDialogProps {
  showPreview: Attachment | null;
  setShowPreview: (showPreview: Attachment | null) => void;
  copyAttachmentContent: (attachment: Attachment) => Promise<void>;
  copiedAttachment: number | null;
}

export function AttachmentPreviewDialog({
  showPreview,
  setShowPreview,
  copyAttachmentContent,
  copiedAttachment,
}: AttachmentPreviewDialogProps) {
  return (
    <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaFile className="h-4 w-4" />
              {showPreview?.fileName ?? 'File Preview'}
            </div>
            {showPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyAttachmentContent(showPreview)}
                className="h-9 px-4 rounded-lg"
              >
                {copiedAttachment === showPreview.id ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Content
                  </>
                )}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] w-full">
          <pre className="whitespace-pre-wrap text-sm p-6 bg-muted/30 rounded-xl border">
            {showPreview?.content ?? 'Loading...'}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
