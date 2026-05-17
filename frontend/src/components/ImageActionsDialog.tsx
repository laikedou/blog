'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      toast.error(err.message || t('common.failedGenerateImage'));
    }
    setGenerating(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-clay" /> {t('common.imageActions')}
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
                <Wand2 className="h-4 w-4 text-clay" /> {t('common.replaceWithAI')}
              </h4>
              <Input
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder={t('common.describeNewImage')}
              />
              <Button
                type="button"
                onClick={handleAiReplace}
                disabled={generating || !aiPrompt.trim()}
                className="w-full"
              >
                {generating ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {t('common.generating')}</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> {t('common.generateAndReplace')}</>
                )}
              </Button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-caption-sm text-ink-muted">{t('common.or')}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Replace from Media */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMediaPicker(true)}
              className="w-full"
            >
              <Image className="h-4 w-4 mr-2" /> {t('common.chooseFromLibrary')}
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
