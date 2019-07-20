// TODO: look into videoConstraints property on captureOptions to force vp9 to a smaller bitrate possibly?
const captureOptions: chrome.tabCapture.CaptureOptions = { audio: true, video: true };
// MediaRecorder is not available in chrome.ts
declare var MediaRecorder;

const codecs = {
    webm: 'video/webm', // 37 MB, 2min youtube record test, appears to be same as avc1
    vp8: 'video/webm;codecs=vp8', // 67 MB
    vp9: 'video/webm;codecs=vp9', // 234.6 MB
    h264: 'video/webm;codecs=H264', // 37 MB
    // avc1: 'video/webm;codecs=avc1' // 37 MB
};

// const videoType = 'webm';
// const videoType = 'h264';
const videoType = 'vp9';
const videoBitsPerSecond = 2500 * 1000;

export class Recorder {
    recordedChunks: any[];
    mediaRecorder;
    currentStream: MediaStream;

    constructor() {
        this.recordedChunks = [];
        this.mediaRecorder = null;
    }

    start(cb) {
        function createListener(self) {
            return (stream) => {
                self.currentStream = stream;
                if (self.currentStream) {
                    self.recordedChunks = [];
                    const options = { mimeType: codecs[videoType], videoBitsPerSecond };
                    self.mediaRecorder = new MediaRecorder(self.currentStream, options);
                    self.mediaRecorder.start();
                    // setTimeout(self.stop.bind(self), 30 * 60 * 1000); // DEBUG stop after 30min
                    // setTimeout(self.stop.bind(self, cb), 30 * 1000); // DEBUG stop after 30s

                    self.mediaRecorder.ondataavailable = function (event) {
                        console.log(`ondataavailable with size`, event.data.size);
                        if (event.data.size > 0) {
                            // console.log(`Recording ${options.mimeType}, video: ${self.mediaRecorder.videoBitsPerSecond}bps, audio: ${self.mediaRecorder.audioBitsPerSecond}`);
                            self.recordedChunks.push(event.data);
                        }
                    };
                }
            };
        }
        chrome.tabCapture.capture(captureOptions, createListener(this));
    }

    stop(cb) {
        if (this.mediaRecorder.state !== 'inactive') this.mediaRecorder.stop();
        const self = this;
        this.mediaRecorder.onstop = function (event) {
            console.log(`onstop(${videoType}), chunks length`, self.recordedChunks.length);

            const blob = new Blob(self.recordedChunks, {
                type: codecs[videoType]
            });
            self.currentStream.getTracks().forEach(track => track.stop());
            // self.save(blob);
            if (cb) {
                cb(self.createVideoUrl(blob), `capture-${videoType}.webm`);
            } else {
                self.createVideoUrl(blob);
            }
        };

    }

    get isRecording() {
        return this.mediaRecorder && this.mediaRecorder.state !== 'inactive';
    }

    save(blob) {
        const url = URL.createObjectURL(blob);

        chrome.downloads.download({ url, filename: `capture-${videoType}.webm`, saveAs: true }, function (e) {
            console.log("Downloaded");
            window.URL.revokeObjectURL(url);
        });
    }

    createVideoUrl(blob) {
        const url = URL.createObjectURL(blob);
        // window.URL.revokeObjectURL(url);
        return url;
    }

}
