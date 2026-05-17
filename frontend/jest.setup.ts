import '@testing-library/jest-dom';

// Mock react-i18next for all tests
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Map common keys to expected display values
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
    },
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en',
      languages: ['en', 'zh-CN', 'zh-TW', 'ja'],
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

// Mock i18next
jest.mock('@/lib/i18n/i18n', () => ({
  SUPPORTED_LOCALES: ['zh-CN', 'zh-TW', 'en', 'ja'] as const,
  SupportedLocale: {},
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
}));

// Mock LanguageProvider - using createElement to avoid JSX in setup
jest.mock('@/lib/i18n/LanguageProvider', () => {
  const React = require('react');
  return {
    LanguageProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useLanguage: () => ({
      locale: 'en' as const,
      setLocale: jest.fn(),
      isLoading: false,
      supportedLocales: ['zh-CN', 'zh-TW', 'en', 'ja'] as const,
    }),
    SUPPORTED_LOCALES: ['zh-CN', 'zh-TW', 'en', 'ja'] as const,
  };
});
