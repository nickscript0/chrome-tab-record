/**
 * TODO:
 *  - Store video chunks in IndexedDB as per https://stackoverflow.com/a/55338272/9204336
 *   1. See the available browser storage space in GB: (await navigator.storage.estimate()).quota / 1024 / 1024 /1024
 *   2. Sample recording chunks of video and combining them into a Blob https://developers.google.com/web/updates/2016/01/mediarecorder
 * 
 * - Can we use https://developer.chrome.com/apps/fileSystem to write directly to the filesystem instead?
 *   Cons: 
 *    1. seems needs to be an App and not an extension: https://stackoverflow.com/a/19813816/9204336
 *    2. would not be portable to Firefox
 * 
 *  1. Weird bug vp9 doesn't seem to honor specified bitrate? See my tests in tests2 dir 
 * 
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
