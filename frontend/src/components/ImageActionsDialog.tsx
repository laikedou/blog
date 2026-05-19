'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ai as aiApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import MediaPickerDialog from './MediaPickerDialog';

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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary">image</span>
              {t('common.imageActions')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="aspect-video rounded-lg overflow-hidden border border-white/10 bg-surface-container-low">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-2.5">
              <h4 className="text-body-sm font-medium text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">auto_awesome</span>
                {t('common.replaceWithAI')}
              </h4>
              <Input
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder={t('common.describeNewImage')}
              />
              <Button
                onClick={handleAiReplace}
                disabled={generating || !aiPrompt.trim()}
                className="w-full"
                variant="default"
              >
                {generating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t('common.generating')}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    {t('common.generateAndReplace')}
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-label-sm text-on-surface-variant">{t('common.or')}</span>
              <Separator className="flex-1" />
            </div>

            <Button
              variant="outline"
              onClick={() => setShowMediaPicker(true)}
              className="w-full"
            >
              <span className="material-symbols-outlined text-[16px]">image</span>
              {t('common.chooseFromLibrary')}
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
