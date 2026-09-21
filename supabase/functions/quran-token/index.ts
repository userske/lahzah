import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

/**
 * quran-token Edge Function
 *
 * Securely exchanges the Quran Foundation Client Credentials for a Bearer token.
 * This function runs on Supabase's servers — the Client Secret never reaches the device.
 *
 * Set these secrets in your Supabase project dashboard:
 *   supabase secrets set QURAN_CLIENT_ID=<your_id> QURAN_CLIENT_SECRET=<your_secret>
 *
 * Or via CLI:
 *   npx supabase secrets set QURAN_CLIENT_ID=bfdcb229-... QURAN_CLIENT_SECRET=qfcs_...
 */

const QURAN_TOKEN_URL = 'https://oauth.quran.foundation/oauth2/token';

// Simple in-memory cache for the duration of the function's warm instance.
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

serve(async (req: Request) => {
  // Allow CORS for Expo Go development
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const now = Date.now();

    // Return cached token if it still has >5 minutes of validity
    if (cachedToken && now < tokenExpiresAt - 5 * 60 * 1000) {
      return new Response(JSON.stringify({ access_token: cachedToken }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const clientId = Deno.env.get('QURAN_CLIENT_ID');
    const clientSecret = Deno.env.get('QURAN_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('QURAN_CLIENT_ID or QURAN_CLIENT_SECRET not set in Supabase secrets');
    }

    // Exchange credentials for a Bearer token using OAuth2 Client Credentials grant
    const tokenRes = await fetch(QURAN_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      throw new Error(`Token exchange failed (${tokenRes.status}): ${errBody}`);
    }

    const tokenData = await tokenRes.json();
    cachedToken = tokenData.access_token;
    // expires_in is in seconds; convert to milliseconds
    tokenExpiresAt = now + (tokenData.expires_in ?? 3600) * 1000;

    return new Response(JSON.stringify({ access_token: cachedToken }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    console.error('[quran-token]', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
