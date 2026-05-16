import { useState, useEffect } from 'react';
import { siteConfig as siteConfigApi } from '@/lib/api';

interface SiteConfig {
  siteTitle: string;
  siteTagline: string;
  siteDescription: string;
  adminTitle: string;
  logoUrl: string;
  faviconUrl: string;
  footerText: string;
  copyrightText: string;
  contactEmail: string;
  socialLinks: string;
  seoHomeTitle: string;
  seoHomeDescription: string;
  postsPerPage: number;
  enableComments: boolean;
  customHeadHtml: string;
  privacyPolicyContent: string;
  termsOfUseContent: string;
}

const defaultConfig: SiteConfig = {
  siteTitle: 'AI Blog',
  siteTagline: '',
  siteDescription: '',
  adminTitle: 'Blog Admin',
  logoUrl: '',
  faviconUrl: '',
  footerText: '',
  copyrightText: '',
  contactEmail: '',
  socialLinks: '{}',
  seoHomeTitle: '',
  seoHomeDescription: '',
  postsPerPage: 10,
  enableComments: true,
  customHeadHtml: '',
  privacyPolicyContent: '',
  termsOfUseContent: '',
};

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    siteConfigApi.get()
      .then(setConfig)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { config, loading };
}
