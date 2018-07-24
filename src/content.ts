chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === 'beginCapture') {
        console.log(`Content Script beginning capture`);

        // sendResponse({
        //     data: payload
        // });
    }
});
