<p align="center"><img src="assets/logo.svg" width="96" alt="Logo"></p>

# YouTube Resume (Local)

A Chromium extension that resumes YouTube videos from where you left off. Progress is kept only in the browser's local storage: no account, no server, no tracking.

- Saves your position every 5 seconds while a video plays, skipping ads
- Seeks back to it when you reopen the video
- Forgets a video once you finish it
- Deletes entries older than 90 days

## Install

1. Download this repository (**Code > Download ZIP**) and unzip it.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the `extension` folder.

## Development

The source is TypeScript, in `src/`. The JavaScript in `extension/` is generated, so don't edit it by hand; commit it after building so the install steps above keep working.

```sh
npm install
npm run build
```
