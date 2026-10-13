export interface BackerNote {
  address: string;
  note: string;
  emoji?: string;
  timestamp: number;
}

const STORAGE_PREFIX = 'collective_backer_notes_';

// Seeded fun notes for common test addresses or pools to make the UI feel alive and collaborative
const DEFAULT_POOL_CHEERS: Record<number, Record<string, { note: string; emoji: string }>> = {
  1: {
    '0x70997970c51812dc3a010c7d01b50e0d17dc79c8': { note: 'Happy to support this initiative!', emoji: '🚀' },
    '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc': { note: 'Count me in for the team!', emoji: '🍕' },
  },
  2: {
    '0x70997970c51812dc3a010c7d01b50e0d17dc79c8': { note: 'Cabin trip booked! Cannot wait.', emoji: '✈️' },
    '0x90f79bf6eb2c4f870365e785982e1f101e93b906': { note: 'Bringing board games and snacks', emoji: '🏕️' },
  },
  3: {
    '0x70997970c51812dc3a010c7d01b50e0d17dc79c8': { note: 'Great farewell gift, well deserved!', emoji: '🎁' },
  },
};

export function getBackerNotes(poolId: number): Record<string, BackerNote> {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${poolId}`);
    const localNotes: Record<string, BackerNote> = raw ? JSON.parse(raw) : {};

    // Merge with default cheers if any exist for this pool
    const defaults = DEFAULT_POOL_CHEERS[poolId] || {};
    const merged: Record<string, BackerNote> = { ...localNotes };

    for (const [addr, cheer] of Object.entries(defaults)) {
      const lower = addr.toLowerCase();
      if (!merged[lower]) {
        merged[lower] = {
          address: addr,
          note: cheer.note,
          emoji: cheer.emoji,
          timestamp: 1710000000000,
        };
      }
    }

    return merged;
  } catch {
    return {};
  }
}

export function saveBackerNote(poolId: number, address: string, note: string, emoji?: string): void {
  if (!address || !note.trim()) return;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${poolId}`);
    const existing: Record<string, BackerNote> = raw ? JSON.parse(raw) : {};
    existing[address.toLowerCase()] = {
      address,
      note: note.trim(),
      emoji,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${STORAGE_PREFIX}${poolId}`, JSON.stringify(existing));
  } catch (err) {
    console.warn('Failed to save backer note:', err);
  }
}
