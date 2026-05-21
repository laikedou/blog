import '@testing-library/jest-dom';

// Mock next-intl useTranslations for all tests
jest.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => {
      const keyMap: Record<string, string> = {
        'nav.home': 'Home',
        'nav.learn': 'Learn',
        'nav.ai': 'AI',
        'nav.web3': 'Web3',
        'nav.blockchain': 'Blockchain',
        'nav.dev': 'Dev',
        'nav.signIn': 'Sign in',
        'nav.signOut': 'Sign out',
        'nav.register': 'Register',
        'nav.getStarted': 'Get started',
        'nav.dashboard': 'Dashboard',
        'nav.myPosts': 'My Posts',
        'nav.viewSite': 'View Site',
        'nav.userMenu': 'User menu',
        'nav.openMenu': 'Open menu',
        'nav.closeMenu': 'Close menu',
        'nav.admin': 'Admin',
        'footer.description': 'A modern personal blog platform powered by AI. Write smarter, publish faster.',
        'footer.quickLinks': 'Quick Links',
        'footer.categories': 'Categories',
        'footer.support': 'Support',
        'footer.home': 'Home',
        'footer.signIn': 'Sign In',
        'footer.register': 'Register',
        'footer.privacyPolicy': 'Privacy Policy',
        'footer.termsOfUse': 'Terms of Use',
        'footer.technology': 'Technology',
        'footer.programming': 'Programming',
        'footer.design': 'Design',
        'footer.aiMl': 'AI &amp; ML',
        'common.poweredBy': 'Powered by Next.js &amp; NestJS',
        'common.allRightsReserved': 'All rights reserved',
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.search': 'Search',
      };
      if (keyMap[key]) return keyMap[key];
      const parts = key.split('.');
      return parts[parts.length - 1];
    };
    // Also attach .rich() for Trans replacements
    (t as any).rich = (key: string, _components: any) => key;
    return t;
  },
  useLocale: () => 'en',
  hasLocale: () => true,
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock next-intl/navigation
jest.mock('next-intl/navigation', () => ({
  createNavigation: () => ({
    Link: ({ children }: { children: React.ReactNode }) => children,
    redirect: jest.fn(),
    usePathname: () => '/en',
    useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
  }),
}));

// Mock @/i18n/navigation
jest.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/en',
  Link: ({ children }: { children: React.ReactNode }) => children,
  redirect: jest.fn(),
}));

// Mock @/i18n/routing
jest.mock('@/i18n/routing', () => ({
  SUPPORTED_LOCALES: ['zh-CN', 'zh-TW', 'en', 'ja'] as const,
  LOCALE_LABELS: {
    'zh-CN': '简体中文',
    'zh-TW': '繁體中文',
    'en': 'English',
    'ja': '日本語',
  },
  LOCALE_FLAGS: {
    'zh-CN': '🇨🇳',
    'zh-TW': '🇹🇼',
    'en': '🇺🇸',
    'ja': '🇯🇵',
  },
  routing: {
    locales: ['zh-CN', 'zh-TW', 'en', 'ja'],
    defaultLocale: 'zh-CN',
  },
}));
