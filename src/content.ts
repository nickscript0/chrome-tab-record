import { UserConfig, Commands, Codecs, nn } from './types';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    sendResponse(null);
    if (request.command === Commands.PromptConfig) {
        estimateRecordingTime().then(estimate => {
            if (estimate) {
                const config = promptConfig(estimate.msg);
                if (!config) return;
                chrome.runtime.sendMessage({
                    command: Commands.ReturnConfig,
                    data: config,
                    storageEstimate: estimate.storageEstimate
                });
            } else {
                console.log(`Error: unable to retrive StorageEstimate`);
            }
        });
    }
});

function promptConfig(recordingTimeMsg: string): UserConfig | null {
    const configStr = window.prompt(`Input encoder/bitrate_kbps/duration_minutes e.g., vp9/2500/60\n\n${recordingTimeMsg}`, 'h264/2500/0');
    if (configStr === null) return null;
    let config: UserConfig = {
        encoder: 'vp9',
        bitrateKbps: 2500,
        durationMinutes: 0
    };

    if (configStr) {
        const cs = configStr.split('/');
        if (cs.length === 3) {
            config = {
                encoder: cs[0] as keyof Codecs,
                bitrateKbps: parseInt(cs[1]),
                durationMinutes: parseFloat(cs[2])
            };
        }
    }
    return config;
}

async function estimateRecordingTime() {
    const estimate = await navigator.storage.estimate();
    if (!estimate.quota || !estimate.usage) return undefined;
    const remainingMB = toMB(estimate.quota - estimate.usage);
    const usageMB = toMB(estimate.usage);
    const percentUsage = (estimate.usage / estimate.quota * 100).toFixed(2);

    /**
     * h264 2500 kbps: 88 MB / 5min ~= 18 MB / min
     * h264 3000 kbps: 105 MB / 5min ~= 21 MB / min
     * h265 5000 kbps: 173 MB / 5min ~= 34.6 MB / min
     */
    const h264_2500_hours = (remainingMB / 18 / 60).toFixed(1);
    const h264_3000_hours = (remainingMB / 21 / 60).toFixed(1);
    const h264_5000_hours = (remainingMB / 34.6 / 60).toFixed(1);

    const msg = `For h264 codec this allows ${h264_2500_hours}h @ 2500kbps, ${h264_3000_hours}h @ 3000kbps, ${h264_5000_hours}h @ 5000kbps.` +
        `\n\nYou are using ${nn(usageMB)} MB (${percentUsage}%) with ${nn(remainingMB)} MB remaining of total ${nn(toMB(estimate.quota / 1024))} GB storage. `;

    console.log(msg);
    return {
        msg,
        storageEstimate: estimate
    };
}

function toMB(bytes: number): number {
    return bytes / 1024 / 1024;
}

