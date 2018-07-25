const captureOptions = { audio: true, video: true };
declare var MediaRecorder;

const videoType = 'webm';
export class Recorder {
    recordedChunks: any[];
    mediaRecorder;
    currentStream: MediaStream;

    constructor() {
        this.recordedChunks = [];
        this.mediaRecorder = null;
    }

    start() {
        function createListener(self) {
            return (stream) => {
                self.currentStream = stream;
                if (self.currentStream) {
                    self.recordedChunks = [];
                    const options = { mimeType: `video/${videoType}` };
                    self.mediaRecorder = new MediaRecorder(self.currentStream, options);
                    self.mediaRecorder.start();
                    self.mediaRecorder.ondataavailable = function (event) {
                        console.log(`ondataavailable with size`, event.data.size);
                        if (event.data.size > 0) {
                            self.recordedChunks.push(event.data);
                        }
                    };
                }
            };
        }
        chrome.tabCapture.capture(captureOptions, createListener(this));
    }

    stop() {
        this.mediaRecorder.stop();
        const self = this;
        this.mediaRecorder.onstop = function (event) {
            console.log(`onstop, chunks length`, self.recordedChunks.length);

            const blob = new Blob(self.recordedChunks, {
                type: `video/${videoType}`
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a') as any;
            document.body.appendChild(a);
            a.style = 'display: none';
            a.href = url;
            a.download = `test.${videoType}`;
            a.click();
            console.log(`Recording available at`, url);
            window.URL.revokeObjectURL(url);
            self.currentStream.getTracks().forEach(track => track.stop());
        };

    }

}



