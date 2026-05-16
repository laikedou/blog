'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType>({
  confirm: () => Promise.resolve(false),
});

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmOptions | null>(null);
  const [resolve, setResolve] = useState<((value: boolean) => void) | null>(null);
  const [open, setOpen] = useState(false);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((res) => {
      setState(options);
      setResolve(() => res);
      setOpen(true);
    });
  }, []);

  const handleConfirm = () => {
    if (resolve) resolve(true);
    setOpen(false);
  };

  const handleCancel = () => {
    if (resolve) resolve(false);
    setOpen(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-start gap-4">
              {state?.variant === 'destructive' && (
                <div className="rounded-full bg-red-100 p-2 shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              )}
              <div>
                <DialogTitle>{state?.title || 'Confirm'}</DialogTitle>
                <DialogDescription className="mt-1.5">
                  {state?.message || 'Are you sure?'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancel}>
              {state?.cancelLabel || 'Cancel'}
            </Button>
            <Button
              variant={state?.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={handleConfirm}
            >
              {state?.confirmLabel || 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
