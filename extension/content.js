"use strict";
const SAVE_INTERVAL_MS = 5000;
const LOG_PREFIX = '[YT-Resume]';
function log(...args) {
    console.log(LOG_PREFIX, ...args);
}
let videoEl = null;
let currentVideoId = null;
let hasResumedForCurrent = false;
let lastSaveTime = 0;
function getVideoIdFromUrl(url) {
    try {
        return new URL(url).searchParams.get('v');
    }
    catch (error) {
        return null;
    }
}
function isAdShowing() {
    const player = document.querySelector('.html5-video-player');
    return player !== null && player.classList.contains('ad-showing');
}
function saveProgress(video, videoId) {
    if (video === null || videoId === null) {
        log('saveProgress skip: no video/videoId', { hasVideo: video !== null, videoId });
        return;
    }
    if (!video.duration || Number.isNaN(video.duration)) {
        log('saveProgress skip: no duration yet', { videoId, duration: video.duration });
        return;
    }
    const fraction = video.currentTime / video.duration;
    if (fraction >= COMPLETION_THRESHOLD) {
        log('saveProgress: near end, removing entry', { videoId, fraction });
        chrome.storage.local.remove(storageKey(videoId));
        return;
    }
    log('saveProgress: saving', { videoId, time: video.currentTime, duration: video.duration });
    chrome.storage.local.set({
        [storageKey(videoId)]: {
            time: video.currentTime,
            duration: video.duration,
            updatedAt: Date.now(),
        },
    });
}
function tryResume() {
    log('tryResume called', {
        hasResumedForCurrent,
        currentVideoId,
        isAd: isAdShowing(),
        duration: videoEl !== null ? videoEl.duration : null,
    });
    if (hasResumedForCurrent || currentVideoId === null)
        return;
    if (isAdShowing())
        return;
    const video = videoEl;
    if (video === null || !video.duration)
        return;
    // Set before the async lookup resolves so a second loadedmetadata
    // firing in the same tick (ad -> content swap) can't double-trigger.
    hasResumedForCurrent = true;
    const key = storageKey(currentVideoId);
    chrome.storage.local.get(key, (result) => {
        const entry = result[key];
        if (entry === undefined) {
            log('tryResume: no stored entry', { videoId: currentVideoId });
            return;
        }
        const fraction = entry.time / entry.duration;
        if (fraction >= COMPLETION_THRESHOLD) {
            log('tryResume: stored entry near end, removing', entry);
            chrome.storage.local.remove(key);
            return;
        }
        log('tryResume: seeking', { videoId: currentVideoId, time: entry.time });
        video.currentTime = entry.time;
    });
}
function onTimeUpdate() {
    if (currentVideoId === null || isAdShowing())
        return;
    const now = Date.now();
    if (now - lastSaveTime < SAVE_INTERVAL_MS)
        return;
    lastSaveTime = now;
    saveProgress(videoEl, currentVideoId);
}
function bindVideo(video) {
    log('bindVideo: video element found, attaching listeners', { readyState: video.readyState });
    videoEl = video;
    video.addEventListener('loadedmetadata', tryResume);
    video.addEventListener('timeupdate', onTimeUpdate);
    // HAVE_METADATA or later: loadedmetadata already fired before we
    // got here (content script loaded after the video element existed).
    if (video.readyState >= 1) {
        tryResume();
    }
}
function waitForVideoElement() {
    const existing = document.querySelector('video.html5-main-video');
    if (existing !== null) {
        bindVideo(existing);
        return;
    }
    log('waitForVideoElement: not found yet, observing DOM');
    const observer = new MutationObserver(() => {
        const video = document.querySelector('video.html5-main-video');
        if (video !== null) {
            observer.disconnect();
            bindVideo(video);
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
}
function handleNavigation() {
    const newVideoId = getVideoIdFromUrl(location.href);
    log('handleNavigation', { from: currentVideoId, to: newVideoId, url: location.href });
    if (newVideoId === currentVideoId)
        return;
    if (currentVideoId !== null && videoEl !== null) {
        saveProgress(videoEl, currentVideoId);
    }
    currentVideoId = newVideoId;
    hasResumedForCurrent = false;
}
function init() {
    log('init: content script loaded', { url: location.href });
    handleNavigation();
    waitForVideoElement();
    // YouTube is a SPA; this fires on every internal navigation.
    document.addEventListener('yt-navigate-finish', handleNavigation);
    window.addEventListener('pagehide', () => {
        log('pagehide: saving before unload');
        saveProgress(videoEl, currentVideoId);
    });
}
init();
