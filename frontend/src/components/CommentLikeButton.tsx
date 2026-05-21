'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth';
import { comments } from '@/lib/api';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  commentId: number;
  initialLikes?: number;
}

export default function CommentLikeButton({ commentId, initialLikes = 0 }: Props) {
  const t = useTranslations();
  const { isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isAuthenticated && commentId) {
      comments.getLikeStatus(commentId)
        .then(data => {
          setLiked(data.liked);
          if (data.likesCount !== undefined) setLikesCount(data.likesCount);
        })
        .catch(() => {})
        .finally(() => setChecked(true));
    } else {
      setChecked(true);
    }
  }, [isAuthenticated, commentId]);

  const handleToggle = async () => {
    if (!isAuthenticated) {
      toast.error(t('viz.signInToLike'));
      return;
    }
    setLoading(true);
    try {
      const result = await comments.like(commentId);
      setLiked(result.liked);
      // After toggle, the server returns the new state; we increment/decrement locally
      setLikesCount(prev => result.liked ? prev + 1 : Math.max(0, prev - 1));
    } catch {
      toast.error(t('viz.likeFailed'));
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading || !checked}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-caption-sm transition-all ${
        liked
          ? 'text-red-500'
          : 'text-ink-muted hover:text-red-500'
      }`}
      title={liked ? t('viz.unlike') : t('viz.like')}
    >
      <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-red-500 text-red-500' : ''} ${loading ? 'animate-pulse' : ''}`} />
      {likesCount > 0 && <span className="tabular-nums">{likesCount}</span>}
    </button>
  );
}
