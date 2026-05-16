'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { visualizations } from '@/lib/api';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  visualizationId: number;
  initialLikes?: number;
}

export default function VisualizationLikeButton({ visualizationId, initialLikes = 0 }: Props) {
  const { isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);
  const [checkedStatus, setCheckedStatus] = useState(false);

  useEffect(() => {
    if (isAuthenticated && visualizationId) {
      visualizations.getLikeStatus(visualizationId)
        .then(data => {
          setLiked(data.liked);
          setLikesCount(data.likesCount);
        })
        .catch(() => {})
        .finally(() => setCheckedStatus(true));
    } else {
      setCheckedStatus(true);
    }
  }, [isAuthenticated, visualizationId]);

  const handleToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to like');
      return;
    }
    setLoading(true);
    try {
      const result = await visualizations.like(visualizationId);
      setLiked(result.liked);
      setLikesCount(result.likesCount);
    } catch {
      toast.error('Failed to update like');
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading || !checkedStatus}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-editorial-xs border transition-all text-body-sm ${
        liked
          ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
          : 'border-border text-ink-muted hover:text-red-500 hover:border-red-200 hover:bg-red-50'
      }`}
      title={liked ? 'Unlike' : 'Like'}
    >
      <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''} transition-all ${loading ? 'animate-pulse' : ''}`} />
      <span className="font-medium tabular-nums">{likesCount}</span>
    </button>
  );
}
