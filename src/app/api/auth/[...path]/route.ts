import { auth } from '@/lib/auth';

import { NextRequest } from 'next/server';

const { GET: authGET, POST: authPOST } = auth.handler();

type AppRouteHandler = (req: NextRequest, ctx: unknown) => Promise<Response> | Response;

function stripSecureInDev(handler: AppRouteHandler): AppRouteHandler {
  return async (req: NextRequest, ctx: unknown) => {
    const res = await handler(req, ctx);
    if (process.env.NODE_ENV === 'development' && res) {
      const setCookies = res.headers.getSetCookie();
      if (setCookies && setCookies.length > 0) {
        res.headers.delete('set-cookie');
        for (const cookie of setCookies) {
          // Replace "Secure;" or "Secure" with empty string
          res.headers.append('set-cookie', cookie.replace(/Secure;?\s?/gi, ''));
        }
      }
    }
    return res;
  };
}

export const GET = stripSecureInDev(authGET);
export const POST = stripSecureInDev(authPOST);
