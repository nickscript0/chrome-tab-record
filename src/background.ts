import { Recorder } from './recorder';
import { Commands, UserConfig } from './types';

const recorder = new Recorder();

chrome.browserAction.onClicked.addListener(function () {

    if (!recorder.isRecording) {
        console.log(`Begin tab capture`);
        requestConfigFromContentScript();
    } else {
        console.log(`End tab capture`);
        recorder.stop((url, filename) => {
            sendUrlToContentScript(url, filename);
        });
    }
});

function sendUrlToContentScript(videoUrl, filename) {
    const url = chrome.extension.getURL("display.html");
    chrome.tabs.create({ url: url }, (currentTab: chrome.tabs.Tab) => {
        chrome.tabs.onUpdated.addListener(onUpdatedListener);
        function onUpdatedListener(tabId: number, info) {
            if (currentTab.id === tabId && info.status === 'complete') {
                chrome.tabs.sendMessage(currentTab.id, { videoUrl, filename }, r => { });
                chrome.tabs.onUpdated.removeListener(onUpdatedListener);
            }
        }
    });
}

function requestConfigFromContentScript() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { command: Commands.PromptConfig });
        } else {
            console.log(`Error: no active tabs available`);
        }
    });
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        sendResponse(null);
        if (request.command === Commands.ReturnConfig) {
            recorder.start(request.data, request.storageEstimate, (url, filename) => {
                sendUrlToContentScript(url, filename);
            });
        }
    }
);