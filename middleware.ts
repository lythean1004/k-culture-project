import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
  locales: ['en', 'ja', 'zh-Hans', 'zh-Hant'],
  defaultLocale: 'en',
  localePrefix: 'always',
});

function validateBasicAuth(authHeader: string): boolean {
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'basic') return false;
  const decoded = Buffer.from(parts[1], 'base64').toString('utf-8');
  const [user, pass] = decoded.split(':');
  
  const expectedUser = process.env.ADMIN_USER || 'admin';
  const expectedPass = process.env.ADMIN_PASSWORD || 'admin123!';
  return user === expectedUser && pass === expectedPass;
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  if (pathname.startsWith('/admin')) {
    const auth = req.headers.get('authorization');
    if (!auth || !validateBasicAuth(auth)) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' } 
      });
    }
    return NextResponse.next();
  }
  
  return intlMiddleware(req);
}

export const config = { matcher: ['/((?!api|_next|.*\\..*).*)'] };
