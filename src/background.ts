import { Recorder } from './recorder';


let start = false;
const recorder = new Recorder();

chrome.browserAction.onClicked.addListener(function () {
    if (!start) {
        console.log(`Begin tab capture`);

        recorder.start();
        start = true;
    } else {
        console.log(`End tab capture`);

        recorder.stop();
        start = false;
    }
});
