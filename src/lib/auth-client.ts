import { createAuthClient } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters';

export const authClient = createAuthClient(
  process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : ''), 
  {
    adapter: BetterAuthReactAdapter(),
  }
);
