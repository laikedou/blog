'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Save, Check } from 'lucide-react';

interface Props {
  content: string;
  accentColor: string;
  onSave: (content: string) => Promise<void>;
}

export default function AIToolTabEdit({ content, accentColor, onSave }: Props) {
  const t = useTranslations('viz.tools');
  const [text, setText] = useState(content);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(text);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/30 font-medium uppercase tracking-wider">Markdown Editor</span>
        <button
          onClick={handleSave}
          disabled={saving || text === content}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
            border: `1px solid ${accentColor}25`,
            color: accentColor,
          }}
        >
          {saving ? (
            <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : saved ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saved ? t('saveSuccess') || 'Saved' : t('saveVersion') || 'Save Version'}
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 w-full p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-white/10 focus:border-white/10 transition-all leading-relaxed"
        style={{ caretColor: accentColor }}
        spellCheck={false}
      />
    </div>
  );
}
