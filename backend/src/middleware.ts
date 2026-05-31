//En Next.js App Router, NO se usa cors como en Express.
//La forma correcta es: Middleware global (src/middleware.ts)
/* Este  middleware aplica CORS a todas las rutas API:
//   - Maneja OPTIONS (preflight)
//   - Permite headers Authorization (JWT)
//   - Permite cookies (credentials)
//   - Restringe or��genes (no * en prod)
//   - Aplica solo a /api/*
*/
// import './prisma-augmentation';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  //'http://localhost:3001', // otro front si existe
];

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin');

  // Preflight request
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin ?? '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  const res = NextResponse.next();

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
  }

  res.headers.set(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,DELETE,OPTIONS'
  );
  res.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  res.headers.set('Access-Control-Allow-Credentials', 'true');

  return res;
}

export const config = {
  matcher: '/api/:path*',
};
