'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLive2D } from '@/lib/live2d-context';
import { buildWidgetOptions, isExcludedPath } from '@/lib/live2d-config';
import type { Widget } from 'l2d-widget';

export default function Live2DWidget() {
  const pathname = usePathname();
  const t = useTranslations();
  const { isHidden, hide } = useLive2D();
  const widgetRef = useRef<Widget | null>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    function check() {
      const mobile = window.innerWidth < 768;
      const excluded = isExcludedPath(window.location.pathname);
      setShouldRender(!mobile && !excluded);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [pathname]);

  useEffect(() => {
    if (!shouldRender || isHidden) return;

    let cancelled = false;
    let widget: Widget | null = null;

    async function init() {
      const { createWidget } = await import('l2d-widget');

      if (cancelled) return;

      const tipsMessages = [
        t('live2d.tips.0'),
        t('live2d.tips.1'),
        t('live2d.tips.2'),
      ].filter(Boolean);

      const welcomeMessages = [
        t('live2d.tips.welcome.0'),
        t('live2d.tips.welcome.1'),
      ].filter(Boolean);

      const options = buildWidgetOptions(tipsMessages, welcomeMessages);

      options.menus = {
        extraItems: [
          {
            icon: 'mdi:eye-off',
            label: t('live2d.menu.hide'),
            onClick: () => hide(),
          },
        ],
      };

      widget = createWidget(options);
      widgetRef.current = widget;
    }

    init();

    return () => {
      cancelled = true;
      if (widgetRef.current) {
        const w = widgetRef.current;
        widgetRef.current = null;
        w.destroy().catch(() => {});
      }
    };
  }, [shouldRender, isHidden, t, hide]);

  if (!shouldRender || isHidden) return null;

  return null;
}
