'use client';

import { useState } from 'react';
import { ai as aiApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import MediaPickerDialog from './MediaPickerDialog';
import { Sparkles, Image, Loader2, Wand2 } from 'lucide-react';

interface ImageActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onReplace: (newUrl: string) => void;
}

export default function ImageActionsDialog({ open, onOpenChange, imageUrl, onReplace }: ImageActionsDialogProps) {
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleAiReplace = async () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    try {
      const r = await aiApi.transformImage({ imageUrl, prompt: aiPrompt });
      onReplace(r.url);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate image');
    }
    setGenerating(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-clay" /> Image Actions
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview */}
            <div className="aspect-video rounded-editorial-sm overflow-hidden border border-border bg-cream-100">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            </div>

            {/* Replace with AI */}
            <div className="space-y-2.5">
              <h4 className="text-body-sm font-medium text-ink flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-clay" /> Replace with AI
              </h4>
              <Input
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Describe the new image style..."
              />
              <Button
                type="button"
                onClick={handleAiReplace}
                disabled={generating || !aiPrompt.trim()}
                className="w-full"
              >
                {generating ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Generate & Replace</>
                )}
              </Button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-caption-sm text-ink-muted">OR</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Replace from Media */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMediaPicker(true)}
              className="w-full"
            >
              <Image className="h-4 w-4 mr-2" /> Choose from Media Library
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MediaPickerDialog
        open={showMediaPicker}
        onOpenChange={setShowMediaPicker}
        onSelect={(url) => { onReplace(url); onOpenChange(false); }}
      />
    </>
  );
}
