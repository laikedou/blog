'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import imageCompression from 'browser-image-compression';
import { Upload, X, Loader2, Sparkles, ArrowRight, ImageIcon } from 'lucide-react';

interface Props {
  loading: boolean;
  accentColor: string;
  onGenerate: (imageBase64: string, mimeType: string) => void;
}

export default function AIToolGradingUpload({ loading, accentColor, onGenerate }: Props) {
  const t = useTranslations('viz.tools');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<{ base64: string; mimeType: string; previewUrl: string } | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const compressAndSet = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    setCompressing(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
        preserveExif: false,
      });

      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const commaIdx = result.indexOf(',');
          resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(compressed);
      });

      const previewUrl = URL.createObjectURL(compressed);
      setImage({ base64, mimeType: compressed.type, previewUrl });
    } catch {
      // compression failed — fall back to original
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const commaIdx = result.indexOf(',');
          resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const previewUrl = URL.createObjectURL(file);
      setImage({ base64, mimeType: file.type, previewUrl });
    } finally {
      setCompressing(false);
    }
  }, []);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) compressAndSet(file);
  }, [compressAndSet]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) compressAndSet(file);
  }, [compressAndSet]);

  const handleClear = useCallback(() => {
    if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [image]);

  const handleGenerate = () => {
    if (!image) return;
    onGenerate(image.base64, image.mimeType);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6 overflow-y-auto">
      {/* AI icon */}
      <div className="relative shrink-0">
        <div className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{ background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)` }} />
        <div
          className="relative w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${accentColor}15 0%, transparent 60%)`,
            border: `1px solid ${accentColor}20`,
          }}
        >
          <Sparkles className="h-10 w-10" style={{ color: accentColor }} />
        </div>
      </div>

      <div className="shrink-0">
        <h3 className="text-lg font-display text-white/80 mb-2">
          {t('grading.uploadTitle') || 'Upload Homework for Grading'}
        </h3>
        <p className="text-sm text-white/35 max-w-md leading-relaxed">
          {t('grading.uploadHint') || 'Upload a scanned homework image. AI will analyze it and provide detailed feedback with a marked-up result image.'}
        </p>
      </div>

      {/* Upload area */}
      {!image && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`w-full max-w-sm rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer shrink-0 ${
            dragOver ? 'border-cyan-400/40 bg-cyan-400/[0.04]' : 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center">
              <Upload className="h-5 w-5 text-white/30" />
            </div>
            <div>
              <p className="text-sm text-white/50 font-medium">
                {t('grading.dropOrClick') || 'Drop image or click to browse'}
              </p>
              <p className="text-xs text-white/20 mt-1">
                {t('grading.supportedFormats') || 'PNG, JPG up to 10MB'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Compressing indicator */}
      {compressing && (
        <div className="flex items-center gap-2 text-sm text-white/40 shrink-0">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('grading.compressing') || 'Compressing image...'}
        </div>
      )}

      {/* Image preview */}
      {image && !compressing && (
        <div className="relative shrink-0 group">
          <img
            src={image.previewUrl}
            alt={t('common.homeworkPreview')}
            className="max-h-48 max-w-sm rounded-xl border border-white/[0.08] object-contain bg-black/20"
          />
          <button
            onClick={handleClear}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading || compressing || !image}
        className="group relative inline-flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden shrink-0"
        style={{
          background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}15)`,
          border: `1px solid ${accentColor}30`,
          boxShadow: `0 0 30px ${accentColor}10`,
        }}
      >
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {t('grading.grading') || 'Grading...'}
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            {t('grading.startGrading') || 'Start Grading'}
            <ArrowRight className="h-4 w-4 opacity-60 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </div>
  );
}
