import OpenAI from 'openai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

/* ── Types ── */
export interface CelebrityResult {
  name: string;
  imageUrl: string;
  source: string;
}

/* ── Config ── */
const GROQ_API_KEY =
  Constants.expoConfig?.extra?.GROQ_API_KEY ??
  process.env.EXPO_PUBLIC_GROQ_API_KEY ??
  '';

const CACHE_PREFIX = 'resemble_celeb_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const client = new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
  dangerouslyAllowBrowser: true,
});

/* ── Cache helpers ── */
interface CachedEntry {
  results: CelebrityResult[];
  ts: number;
}

async function getCached(name: string): Promise<CelebrityResult[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + name.toLowerCase());
    if (!raw) return null;
    const entry: CachedEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(CACHE_PREFIX + name.toLowerCase());
      return null;
    }
    return entry.results;
  } catch {
    return null;
  }
}

async function setCache(name: string, results: CelebrityResult[]) {
  try {
    const entry: CachedEntry = { results, ts: Date.now() };
    await AsyncStorage.setItem(
      CACHE_PREFIX + name.toLowerCase(),
      JSON.stringify(entry),
    );
  } catch {
    // best-effort
  }
}

/* ── Image validation ── */
async function isImageReachable(url: string): Promise<boolean> {
  try {
    const resp = await fetch(url, { method: 'HEAD' });
    return resp.ok;
  } catch {
    return false;
  }
}

/* ── Main search ── */
export async function searchCelebrity(
  name: string,
): Promise<CelebrityResult[]> {
  if (!name.trim()) return [];

  // Check cache first
  const cached = await getCached(name);
  if (cached) return cached;

  if (!GROQ_API_KEY) {
    throw new Error(
      'GROQ_API_KEY is not set. Add it to your .env as EXPO_PUBLIC_GROQ_API_KEY.',
    );
  }

  const prompt = `Return a JSON array of 3-5 publicly available headshot image URLs for the celebrity "${name}".
Each element must have: { "name": string, "imageUrl": string, "source": string }.
Prefer URLs from:
  - Wikimedia Commons (upload.wikimedia.org)
  - TMDB (image.tmdb.org)
  - Official press kits
The "source" field should be the domain name (e.g. "wikimedia", "tmdb").
Return ONLY the JSON array, no markdown, no explanation.`;

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant that returns only valid JSON arrays. No markdown fences.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 1024,
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? '[]';

  let parsed: CelebrityResult[];
  try {
    // Strip possible markdown fences
    const cleaned = raw.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '');
    parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error('Not an array');
  } catch {
    throw new Error('Could not parse celebrity results from AI response.');
  }

  // Validate each result shape
  parsed = parsed.filter(
    (r) =>
      typeof r.name === 'string' &&
      typeof r.imageUrl === 'string' &&
      typeof r.source === 'string' &&
      r.imageUrl.startsWith('http'),
  );

  if (parsed.length === 0) {
    throw new Error(`No celebrity photos found for "${name}".`);
  }

  // Validate reachability in parallel, filter out 404s
  const checks = await Promise.all(
    parsed.map(async (r) => ({
      ...r,
      ok: await isImageReachable(r.imageUrl),
    })),
  );
  const valid = checks.filter((c) => c.ok).map(({ ok: _, ...rest }) => rest);

  if (valid.length === 0) {
    throw new Error(
      `Found URLs for "${name}" but none were reachable. Try again later.`,
    );
  }

  await setCache(name, valid);
  return valid;
}
