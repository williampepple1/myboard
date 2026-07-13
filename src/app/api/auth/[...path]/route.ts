import { auth } from '@/lib/auth';

import { NextRequest } from 'next/server';

const { GET: authGET, POST: authPOST } = auth.handler();

function stripSecureInDev(handler: any) {
  return async (req: NextRequest, ctx: any) => {
    const res = await handler(req, ctx);
    if (process.env.NODE_ENV === 'development' && res) {
      const setCookies = res.headers.getSetCookie();
      if (setCookies && setCookies.length > 0) {
        const newHeaders = new Headers(res.headers);
        newHeaders.delete('set-cookie');
        for (const cookie of setCookies) {
          // Replace "Secure;" or "Secure" with empty string
          newHeaders.append('set-cookie', cookie.replace(/Secure;?\s?/gi, ''));
        }
        return new Response(res.body, {
          status: res.status,
          statusText: res.statusText,
          headers: newHeaders,
        });
      }
    }
    return res;
  };
}

export const GET = stripSecureInDev(authGET);
export const POST = stripSecureInDev(authPOST);
