chrome.browserAction.onClicked.addListener(function () {
    console.log(`Background script begin tab capture`);

    // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    //     const mainTabId = tabs[0].id;
    //     if (mainTabId) {
    //         chrome.tabs.sendMessage(mainTabId, { command: 'beginCapture' }, r => {
    //         });
    //     }
    // });

    captureTabAndStartSession(1);

});

const g_sessionInfo = {} as any;

function captureTabAndStartSession(sink_id) {
    chrome.tabs.getCurrent(function (tab) {
        var video_constraints = {
            mandatory: {
                chromeMediaSource: 'tab',
                minWidth: 1920,
                minHeight: 1080,
                maxWidth: 1920,
                maxHeight: 1080,
                minFrameRate: 60,
                maxFrameRate: 60
            }
        };

        var constraints = {
            audio: true,
            video: true,
            // videoConstraints: video_constraints
        };

        function onStream(stream) {
            g_sessionInfo.stream = stream;
            var session_info = {
                sinkId: sink_id,
                videoTrack: g_sessionInfo.stream.getVideoTracks()[0],
                audioTrack: g_sessionInfo.stream.getAudioTracks()[0]
            };

            function onStarted() {
                // if (chrome.runtime.error) {
                //     const lastError = chrome.runtime.lastError && chrome.runtime.lastError.message;
                //     console.log('The Session to sink ' + g_sessionInfo.sinkId
                //         + 'could not start, error: '
                //         + lastError);
                // } else {
                //     console.log('The Session to sink ' + g_sessionInfo.sinkId
                //         + ' has started.');
                // }
            }
            console.log('Starting session to sink: ' + sink_id);
            // chrome.displaySource.startSession(session_info, onStarted);
        }

        chrome.tabCapture.capture(constraints, onStream);
    });
}