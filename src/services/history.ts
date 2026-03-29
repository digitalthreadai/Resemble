import AsyncStorage from '@react-native-async-storage/async-storage';
import { Paths, Directory, File } from 'expo-file-system';
import { Platform } from 'react-native';

// ── Types ────────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  id: string;
  mode: 'family' | 'celebrity';
  scores: Record<string, number>;
  timestamp: number;
  thumbnailPaths: string[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'resemble_history';
const MAX_ENTRIES = 100;
const EVICT_BATCH = 10;

function getThumbsDir(): Directory {
  return new Directory(Paths.document, 'resemble', 'thumbs');
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function ensureThumbsDir(): Promise<void> {
  const dir = getThumbsDir();
  if (!dir.exists) {
    dir.create();
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readEntries(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeEntries(entries: HistoryEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/** Delete thumbnail files for a set of entries. Errors are silently ignored. */
async function deleteThumbnails(entries: HistoryEntry[]): Promise<void> {
  const paths = entries.flatMap(e => e.thumbnailPaths);
  for (const p of paths) {
    try {
      const f = new File(p);
      if (f.exists) {
        f.delete();
      }
    } catch {
      // Ignore
    }
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Save a comparison result to history.
 * Copies source images as small thumbnails into the app document directory.
 * Applies FIFO eviction when the list exceeds MAX_ENTRIES.
 */
export async function saveComparison(
  mode: 'family' | 'celebrity',
  scores: Record<string, number>,
  imageUris: string[],
): Promise<HistoryEntry> {
  const id = generateId();
  const thumbnailPaths: string[] = [];

  // Copy thumbnails (skip on web — no filesystem access)
  if (Platform.OS !== 'web') {
    try {
      await ensureThumbsDir();
      const thumbsDir = getThumbsDir();
      for (let i = 0; i < imageUris.length; i++) {
        const uri = imageUris[i];
        if (!uri) continue;
        const ext = uri.split('.').pop()?.split('?')[0] ?? 'jpg';
        const src = new File(uri);
        const dest = new File(thumbsDir, `${id}_${i}.${ext}`);
        src.copy(dest);
        thumbnailPaths.push(dest.uri);
      }
    } catch {
      // Disk full or copy failed — store entry without thumbnails
    }
  }

  const entry: HistoryEntry = {
    id,
    mode,
    scores,
    timestamp: Date.now(),
    thumbnailPaths,
  };

  // Read existing, prepend new entry
  let entries = await readEntries();
  entries.unshift(entry);

  // FIFO eviction
  if (entries.length > MAX_ENTRIES) {
    const evicted = entries.splice(MAX_ENTRIES - EVICT_BATCH);
    await deleteThumbnails(evicted);
  }

  try {
    await writeEntries(entries);
  } catch {
    // AsyncStorage full — evict oldest batch and retry
    const evicted = entries.splice(-EVICT_BATCH);
    await deleteThumbnails(evicted);
    try {
      await writeEntries(entries);
    } catch {
      // Still failing — give up silently, entry is lost
    }
  }

  return entry;
}

/** Load the full history list, newest first. */
export async function loadHistory(): Promise<HistoryEntry[]> {
  return readEntries();
}

/** Delete a single history entry by id. */
export async function deleteEntry(id: string): Promise<void> {
  const entries = await readEntries();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return;

  const [removed] = entries.splice(idx, 1);
  await deleteThumbnails([removed]);
  await writeEntries(entries);
}

/** Clear all history entries and thumbnails. */
export async function clearAll(): Promise<void> {
  const entries = await readEntries();
  await deleteThumbnails(entries);
  await AsyncStorage.removeItem(STORAGE_KEY);

  // Remove the entire thumbs directory
  try {
    const dir = getThumbsDir();
    if (dir.exists) {
      dir.delete();
    }
  } catch {
    // Ignore
  }
}
