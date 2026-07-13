import { auth } from '@/lib/auth';


const { GET: authGET, POST: authPOST } = auth.handler();

type AuthHandler = typeof authGET;

function stripSecureInDev(handler: AuthHandler): AuthHandler {
  return async (req: Parameters<AuthHandler>[0], ctx: Parameters<AuthHandler>[1]) => {
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
