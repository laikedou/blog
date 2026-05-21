import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AuthProvider } from '@/lib/auth';
import ChatBot from '@/components/ChatBot';
import { CustomHeadInjector } from '@/components/CustomHeadInjector';
import { routing } from '@/i18n/routing';
import './globals.css';

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
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
        <ChatBot />
        <CustomHeadInjector />
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
