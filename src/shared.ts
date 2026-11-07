const STORAGE_PREFIX = 'vh_';
const RETENTION_DAYS = 90;
const COMPLETION_THRESHOLD = 0.99;

interface ProgressEntry {
    time: number;
    duration: number;
    updatedAt: number;
}

function storageKey(videoId: string): string {
    return STORAGE_PREFIX + videoId;
}
