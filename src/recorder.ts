import { UserConfig, Codecs, nn } from "./types";
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

// const videoBitsPerSecond = 2500 * 1000;
const defaultCodec = 'h264';

// Number of seconds in each chunk written to storage
const CHUNK_DURATION_MS = 60000;

export class Recorder {
    // recordedChunks: any[];
    mediaRecorder;
    currentStream: MediaStream;
    videoCodec: keyof Codecs;
    config: UserConfig;
    storage: RecordingStorage;
    runningSizeBytes: number;

    constructor() {
        this.mediaRecorder = null;
        this.storage = new RecordingStorage();
        this.runningSizeBytes = 0;
    }

    start(config: UserConfig, storageEstimate: StorageEstimate, cb) {
        this.config = config;
        function createListener(self: Recorder) {
            return (stream) => {
                self.currentStream = stream;
                if (self.currentStream) {
                    self.videoCodec = defaultCodec;
                    if (!Object.keys(codecsToMimeType).includes(config.encoder)) {
                        console.log(`Unknown codec ${config.encoder} specified, defaulting to ${defaultCodec}`);
                    } else {
                        self.videoCodec = config.encoder;
                    }
                    const options = { mimeType: codecsToMimeType[self.videoCodec], videoBitsPerSecond: config.bitrateKbps * 1000 };
                    self.mediaRecorder = new MediaRecorder(self.currentStream, options);
                    self.mediaRecorder.start(CHUNK_DURATION_MS);
                    console.log(`Started recording with config ${JSON.stringify(config)} chunkSize: ${CHUNK_DURATION_MS / 1000}s`);

                    // Stop recording with timeout if user has specified stop recording after some minutes
                    if (config.durationMinutes) {
                        console.log(`Stopping recording after ${config.durationMinutes} minutes.`);
                        setTimeout(self.stop.bind(self, cb), config.durationMinutes * 60 * 1000);
                    }

                    self.mediaRecorder.ondataavailable = function (event) {
                        if (event.data.size > 0) {
                            // TODO: Buggy? nothing is awaiting this storage.add Promise
                            self.storage.add(event.data).then(info => {
                                if (info) {
                                    self.runningSizeBytes += info.chunkSize;
                                    logEstimates(info.currentId, storageEstimate, self.runningSizeBytes, info.chunkSize, CHUNK_DURATION_MS / 1000);
                                }
                            });
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
            self.storage.getAll().then(blobParts => {
                console.log(`Joining ${blobParts.length} video parts for codec ${self.videoCodec}.`);
                const blob = new Blob(blobParts, {
                    type: codecsToMimeType[self.videoCodec]
                });
                self.storage.finish().then(() => {
                    console.log(`Cleared storage!`);
                    self.runningSizeBytes = 0;
                    self.currentStream.getTracks().forEach(track => track.stop());
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
            // TODO: this is not being called, where can we better call revokeObjectURL?
            window.URL.revokeObjectURL(url);
        });
    }

    createVideoUrl(blob) {
        const url = URL.createObjectURL(blob);
        // window.URL.revokeObjectURL(url);
        return url;
    }

}


function logEstimates(currentId: number, estimate: StorageEstimate, runningSizeBytes: number, chunkSize: number, chunkDurationSeconds: number) {
    const toMB = b => b / 1024 / 1024;
    if (!estimate.quota || !estimate.usage) return undefined;
    const currentUsageBytes = estimate.usage + runningSizeBytes;

    const remainingBytes = estimate.quota - currentUsageBytes;
    const remainingMB = toMB(remainingBytes);
    // const usageMB = toMB(currentUsageBytes);
    const percentUsage = (currentUsageBytes / estimate.quota * 100).toFixed(2);

    const recordingHoursRemaining = nn(chunkDurationSeconds * (remainingBytes / chunkSize) / 3600);
    console.log(
        `Stored blob index ${currentId} of size ${nn(chunkSize / 1024 / 1024)} MB. ` +
        `Total running size ${nn(runningSizeBytes / 1024 / 1024)} MB.\n` + 
        `Recording hours remaining ${recordingHoursRemaining}h, [Storage Usage: ${percentUsage}%, ${nn(remainingMB)} MB remaining]`
    );
}