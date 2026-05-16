'use client';

import { useEffect } from 'react';
import { useSiteConfig } from '@/lib/use-site-config';

export function CustomHeadInjector() {
  const { config } = useSiteConfig();

  useEffect(() => {
    // Inject custom head HTML
    if (config.customHeadHtml) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = config.customHeadHtml;
      const nodes: Node[] = [];
      wrapper.childNodes.forEach(node => {
        document.head.appendChild(node.cloneNode(true));
        nodes.push(node);
      });

      return () => {
        nodes.forEach(node => {
          if (node.parentNode) node.parentNode.removeChild(node);
        });
      };
    }
  }, [config.customHeadHtml]);

  useEffect(() => {
    // Update favicon from site config
    let link = document.querySelector<HTMLLinkElement>(`link[rel="icon"]`);
    if (config.faviconUrl) {
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = config.faviconUrl;
    } else {
      // Reset to default if no custom favicon
      if (link) link.href = '/favicon.ico';
    }
  }, [config.faviconUrl]);

  return null;
}
