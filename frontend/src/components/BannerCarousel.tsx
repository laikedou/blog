'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { banners as bannersApi } from '@/lib/api';
import { animate } from 'animejs';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  postId: number | null;
  post?: { id: number; slug: string } | null;
}

export default function BannerCarousel({ zone = 'hero' }: { zone?: string }) {
  const t = useTranslations();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bannersApi.active({ zone })
      .then(data => setBanners(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [zone]);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % banners.length);
  }, [banners.length]);

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [banners.length, next]);

  // Animate slide content on change
  useEffect(() => {
    if (banners.length === 0) return;
    const el = document.querySelector('[data-banner-content]');
    if (el) {
      animate(el, {
        opacity: [0, 1],
        translateY: [15, 0],
        easing: 'easeOutCubic',
        duration: 600,
      });
    }
  }, [current, banners.length]);

  if (loading || banners.length === 0) return null;

  const banner = banners[current];

  const Wrapper = banner.linkUrl || banner.postId ? Link : 'div';
  const wrapperProps: any = {};
  if (banner.linkUrl) wrapperProps.href = banner.linkUrl;
  else if (banner.postId) wrapperProps.href = banner.post?.slug ? `/posts/${banner.post.slug}` : `/posts/${banner.postId}`;
  if (wrapperProps.href) wrapperProps.className = 'block relative w-full overflow-hidden group';
  const handleBannerClick = () => {
    bannersApi.trackClick(banner.id).catch(() => {});
  };

  return (
    <section className="relative w-full overflow-hidden bg-cream-100">
      <Wrapper {...wrapperProps} onClick={handleBannerClick}>
      <div className="relative w-full" style={{ aspectRatio: '1920/400', maxHeight: '500px' }}>
        {banners.map((b, i) => (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <img
              src={b.imageUrl}
              alt={b.title || t('common.bannerAlt')}
              className="w-full h-full object-cover"
              loading={i === current ? 'eager' : 'lazy'}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        ))}

        {/* Text content */}
        <div className="absolute inset-0 flex items-end">
          <div className="section-container w-full pb-12 md:pb-16">
            <div data-banner-content className="max-w-2xl">
              {banner.title && (
                <h2 className="font-display text-display-lg md:text-display-xl text-white mb-2 drop-shadow-lg">
                  {banner.title}
                </h2>
              )}
              {banner.subtitle && (
                <p className="text-body text-white/80 max-w-xl drop-shadow-md">
                  {banner.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === current ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={t('common.goToSlide', { number: i + 1 })}
            />
          ))}
        </div>
      )}
      </Wrapper>
    </section>
  );
}
