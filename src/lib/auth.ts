import { createRemoteJWKSet, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWKS = createRemoteJWKSet(
  new URL(process.env.NEON_JWKS_URL!)
);

export async function verifySession() {
  const cookieStore = await cookies();
  // Neon Auth / Better Auth typically uses better-auth.session_token
  // If not, we might need to check authorization header
  const token = 
    cookieStore.get('better-auth.session_token')?.value || 
    cookieStore.get('__Secure-better-auth.session_token')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWKS);
    return payload; // Returns the user payload from the JWT
  } catch (e) {
    console.error('JWT verification failed:', e);
    return null;
  }
}
