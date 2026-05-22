import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AuthProvider } from '@/lib/auth';
import { Live2DProvider } from '@/lib/live2d-context';
import ChatBot from '@/components/ChatBot';
import { CustomHeadInjector } from '@/components/CustomHeadInjector';
import { TooltipProvider } from '@/components/ui/tooltip';
import { routing } from '@/i18n/routing';
import './globals.css';

const Live2DWidget = dynamic(() => import('@/components/Live2DWidget'), {
  ssr: false,
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <AuthProvider>
        <Live2DProvider>
          <TooltipProvider>
            <div className="min-h-screen flex flex-col">
              {children}
            </div>
            <ChatBot />
            <Live2DWidget />
            <CustomHeadInjector />
          </TooltipProvider>
        </Live2DProvider>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
