import { UserConfig, Codecs } from "./types";
import { RecordingStorage } from './storage';

// TODO: look into videoConstraints property on captureOptions to force vp9 to a smaller bitrate possibly?
const captureOptions: chrome.tabCapture.CaptureOptions = { audio: true, video: true };
// MediaRecorder is not available in chrome.ts
declare var MediaRecorder;

const codecsToMimeType: Codecs = {
    webm: 'video/webm', // 37 MB, 2min youtube record test, appears to be same as avc1
    vp8: 'video/webm;codecs=vp8', // 67 MB
    vp9: 'video/webm;codecs=vp9', // 234.6 MB
    h264: 'video/webm;codecs=H264', // 37 MB
    // avc1: 'video/webm;codecs=avc1' // 37 MB
};

// const videoType = 'webm';
// const videoType = 'h264';
// const videoType = 'vp9';
// const videoBitsPerSecond = 2500 * 1000;
const defaultCodec = 'h264';

export class Recorder {
    // recordedChunks: any[];
    mediaRecorder;
    currentStream: MediaStream;
    videoCodec: keyof Codecs;
    config: UserConfig;
    storage: RecordingStorage;

    constructor() {
        // this.recordedChunks = [];
        this.mediaRecorder = null;
        this.storage = new RecordingStorage();
    }

    start(config: UserConfig, cb) {
        this.config = config;
        function createListener(self: Recorder) {
            return (stream) => {
                self.currentStream = stream;
                if (self.currentStream) {
                    // self.recordedChunks = [];
                    self.videoCodec = defaultCodec;
                    if (!Object.keys(codecsToMimeType).includes(config.encoder)) {
                        console.log(`Unknown codec ${config.encoder} specified, defaulting to ${defaultCodec}`);
                    } else {
                        self.videoCodec = config.encoder;
                    }
                    const options = { mimeType: codecsToMimeType[self.videoCodec], videoBitsPerSecond: config.bitrateKbps * 1000 };
                    self.mediaRecorder = new MediaRecorder(self.currentStream, options);
                    // Record chunks of 1min
                    self.mediaRecorder.start(60000);
                    console.log(`Started recording with config ${JSON.stringify(config)}`);

                    // Stop recording with timeout if user has specified stop recording after some minutes
                    if (config.durationMinutes) {
                        console.log(`Stopping recording after ${config.durationMinutes} minutes.`);
                        setTimeout(self.stop.bind(self, cb), config.durationMinutes * 60 * 1000);
                    }

                    self.mediaRecorder.ondataavailable = function (event) {
                        console.log(`ondataavailable with size`, event.data.size);
                        if (event.data.size > 0) {
                            // console.log(`Recording ${options.mimeType}, video: ${self.mediaRecorder.videoBitsPerSecond}bps, audio: ${self.mediaRecorder.audioBitsPerSecond}`);
                            // self.recordedChunks.push(event.data);
                            // TODO: Buggy? nothing is awaiting this storage.add Promise
                            self.storage.add(event.data);
                        }
                    };
                }
            };
        }
        chrome.tabCapture.capture(captureOptions, createListener(this));
    }

    stop(cb) {
        if (this.mediaRecorder.state !== 'inactive') this.mediaRecorder.stop();
        const self: Recorder = this;
        this.mediaRecorder.onstop = function (event) {
            // console.log(`onstop(${self.videoCodec}), chunks length`, self.recordedChunks.length);
            console.log(`onstop(${self.videoCodec}), chunks length`, self.storage.length);

            self.storage.getAll().then(blobParts => {
                console.log(`Joining ${blobParts.length} video parts`);
                const blob = new Blob(blobParts, {
                    type: codecsToMimeType[self.videoCodec]
                });
                self.storage.delete().then(() => {
                    self.currentStream.getTracks().forEach(track => track.stop());
                    // self.save(blob);
                    if (cb) {
                        cb(self.createVideoUrl(blob), `capture-${self.videoCodec}-${self.config.bitrateKbps}kbps.webm`);
                    } else {
                        self.createVideoUrl(blob);
                    }
                });
            });

        };

    }

    get isRecording() {
        return this.mediaRecorder && this.mediaRecorder.state !== 'inactive';
    }

    save(blob) {
        const url = URL.createObjectURL(blob);

        chrome.downloads.download({ url, filename: `capture-${this.videoCodec}.webm`, saveAs: true }, function (e) {
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
