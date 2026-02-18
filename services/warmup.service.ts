/**
 * Backend warm-up / health-check service.
 *
 * Called at app launch (while the splash screen is visible) so the
 * backend server is awake and the DB connection pool is open before
 * the user reaches any data-dependent screen.
 *
 * ──────────────────────────────────────────────────────────────────
 *  🔧  BACKEND TODO
 * ──────────────────────────────────────────────────────────────────
 *  Implement  GET /api/v1/health  (public, no auth)
 *
 *  Suggested response:
 *    200 OK
 *    {
 *      "status": "ok",
 *      "timestamp": "2026-02-18T12:00:00.000Z",
 *      "dbConnected": true,
 *      "version": "1.0.0"
 *    }
 *
 *  The endpoint should:
 *    1. Execute a simple DB query (e.g. SELECT 1) to warm the pool.
 *    2. Return `dbConnected: false` (not 500) if the DB is down.
 *    3. Be fast (< 500 ms when warm).
 *    4. NOT require authentication.
 *
 *  If you're on a cold-start host like Render free tier, the first
 *  call may take 10-30 s.  The frontend already applies a generous
 *  timeout and silently swallows failures — the user won't see an
 *  error; the splash just finishes and proceeds.
 * ──────────────────────────────────────────────────────────────────
 */

import axios from 'axios';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://fourzeeproperties-backend.onrender.com';

const WARMUP_TIMEOUT = 15_000; // 15 s — generous for cold starts

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp?: string;
  dbConnected?: boolean;
  version?: string;
}

/**
 * Fire-and-forget ping to the backend so it wakes up.
 * Returns the health payload on success, null on failure.
 * Never throws — safe to call without try/catch.
 */
export async function warmUpBackend(): Promise<HealthResponse | null> {
  try {
    const { data } = await axios.get<HealthResponse>(
      `${API_BASE_URL}/health`,
      { timeout: WARMUP_TIMEOUT },
    );
    console.log('[Splash] Backend warm-up OK:', data.status, data.dbConnected ? '(DB connected)' : '(DB down)');
    return data;
  } catch (err) {
    // Silently swallow — the user will see real errors later
    console.warn('[Splash] Backend warm-up failed (non-blocking):', (err as Error).message);
    return null;
  }
}

export default warmUpBackend;
