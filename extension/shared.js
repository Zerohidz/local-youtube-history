'use strict';

const STORAGE_PREFIX = 'vh_';
const RETENTION_DAYS = 90;
const COMPLETION_THRESHOLD = 0.99;

function storageKey(videoId) {
    return STORAGE_PREFIX + videoId;
}
