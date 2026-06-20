'use strict';

importScripts('shared.js');

const ALARM_NAME = 'vh-cleanup';

chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 60 * 24 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
        cleanupOldEntries();
    }
});

async function cleanupOldEntries() {
    const all = await chrome.storage.local.get(null);
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;

    const staleKeys = Object.entries(all)
        .filter(([key, value]) => key.startsWith(STORAGE_PREFIX) && value.updatedAt < cutoff)
        .map(([key]) => key);

    if (staleKeys.length > 0) {
        await chrome.storage.local.remove(staleKeys);
    }
}
