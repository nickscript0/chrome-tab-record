/**
 * TODO:
 *  - Store video chunks in IndexedDB as per https://stackoverflow.com/a/55338272/9204336
 *   1. See the available browser storage space in GB: (await navigator.storage.estimate()).quota / 1024 / 1024 /1024
 *   2. Sample recording chunks of video and combining them into a Blob https://developers.google.com/web/updates/2016/01/mediarecorder
 */

function setupListeners() {
    chrome.runtime.onMessage.addListener(onMessageListener);

    function onMessageListener(request, sender, sendResponse) {
        const v = document.getElementById('display-video') as HTMLVideoElement;
        v.src = request.videoUrl;
        const downloadButton = document.getElementById('downloadButton') as HTMLAnchorElement;

        downloadButton.href = v.src;
        downloadButton.download = request.filename;
        // chrome.runtime.onMessage.removeListener(onMessageListener);
        console.log(`Displayed recorded video`);

    };
}

setupListeners();
