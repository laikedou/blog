'use client';

import { useState, useEffect } from 'react';
import { diffLines, Change } from 'diff';
import { Loader2 } from 'lucide-react';

interface Props {
  vizId: number;
  toolType: string;
  fromVersionId: number;
  toVersionId: number;
  accentColor: string;
  onLoadCompare: (vizId: number, toolType: string, fromId: number, toId: number) => Promise<{ contentFrom: string; contentTo: string }>;
}

export default function AIToolVersionDiff({
  vizId,
  toolType,
  fromVersionId,
  toVersionId,
  accentColor,
  onLoadCompare,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState<Change[]>([]);

  useEffect(() => {
    setLoading(true);
    onLoadCompare(vizId, toolType, fromVersionId, toVersionId)
      .then((result) => {
        setChanges(diffLines(result.contentFrom, result.contentTo));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [vizId, toolType, fromVersionId, toVersionId, onLoadCompare]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-white/20" />
      </div>
    );
  }

  return (
    <div className="max-h-[400px] overflow-y-auto font-mono text-xs leading-relaxed rounded-xl border border-white/[0.06] bg-black/20">
      {changes.map((change, i) => (
        <div
          key={i}
          className={`px-4 py-0.5 whitespace-pre-wrap ${
            change.added
              ? 'bg-emerald-400/10 text-emerald-300/80'
              : change.removed
                ? 'bg-red-400/10 text-red-300/80'
                : 'text-white/40'
          }`}
        >
          {change.added ? '+ ' : change.removed ? '- ' : '  '}
          {change.value}
        </div>
      ))}
    </div>
  );
}
