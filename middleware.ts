import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'ja', 'zh-Hans', 'zh-Hant'],
  defaultLocale: 'en',
  localePrefix: 'always',
});

export const config = { matcher: ['/((?!api|_next|admin|.*\\..*).*)'] };
