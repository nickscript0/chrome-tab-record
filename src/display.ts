/**
 * TODO:
 *  1. Pass remaining quota info to background so we can calculate remaining space and time on the fly and log it
 *  2. Figure out why windows chrome doesn't save chunks after the 2nd time on after loading the extension
 *  3. Add check and prompts for resuming unfinished recording sessions "A recording in progress exists would you like to continue it?"

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
