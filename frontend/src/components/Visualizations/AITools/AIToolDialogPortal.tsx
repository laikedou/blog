'use client';

import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import AIToolParticles from './AIToolParticles';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export default function AIToolDialogPortal({ open, onOpenChange, children }: Props) {
  const t = useTranslations();
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!max-w-4xl !w-[95vw] !h-[90vh] !p-0 !gap-0 !border-0 !bg-transparent overflow-hidden"
      >
        <DialogTitle className="sr-only">{t('viz.aiTools.title')}</DialogTitle>

        <div
          ref={contentRef}
          className="relative w-full h-full rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: 'rgba(12, 16, 32, 0.98)',
            boxShadow: `
              0 0 80px rgba(0, 240, 255, 0.06),
              0 0 40px rgba(124, 58, 237, 0.04),
              inset 0 1px 0 rgba(255,255,255,0.03)
            `,
          }}
        >
          {/* Animated gradient border rings — GPU-accelerated via framer-motion */}
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none z-10"
                  style={{
                    padding: '1.5px',
                    background: 'conic-gradient(from 0deg at 50% 50%, transparent 0%, rgba(0,240,255,0.2) 25%, transparent 50%, rgba(124,58,237,0.15) 75%, transparent 100%)',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMaskComposite: 'xor',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, rotate: 360 }}
                  transition={{ opacity: { duration: 0.3 }, rotate: { duration: 8, repeat: Infinity, ease: 'linear' } }}
                />
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none z-10"
                  style={{
                    padding: '1.5px',
                    background: 'conic-gradient(from 180deg at 50% 50%, transparent 0%, rgba(0,240,255,0.1) 25%, transparent 50%, rgba(124,58,237,0.08) 75%, transparent 100%)',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMaskComposite: 'xor',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, rotate: -360 }}
                  transition={{ opacity: { duration: 0.3 }, rotate: { duration: 12, repeat: Infinity, ease: 'linear' } }}
                />
              </>
            )}
          </AnimatePresence>

          {/* Particle background */}
          <AIToolParticles />

          {/* Content */}
          <motion.div
            className="relative z-10 flex flex-col h-full"
            initial={{ opacity: 0 }}
            animate={open ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            {children}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
