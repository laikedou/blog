import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all pathnames except for static files, api routes, etc.
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
