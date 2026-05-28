import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'ja', 'zh-Hans', 'zh-Hant'],

  // Used when no locale matches
  defaultLocale: 'en',
  
  // If true, the default locale will not have a prefix in the URL
  localePrefix: 'always'
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(en|ja|zh-Hans|zh-Hant)/:path*']
};
