import { UserConfig, Commands, Codecs } from './types';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    sendResponse(null);
    if (request.command === Commands.PromptConfig) {
        estimateRecordingTime().then(recordingTimeMsg => {
            const config = promptConfig(recordingTimeMsg);
            chrome.runtime.sendMessage({
                command: Commands.ReturnConfig,
                data: config
            });
        });

    }
});

function promptConfig(recordingTimeMsg: string): UserConfig {
    const configStr = window.prompt(`Input encoder/bitrate_kbps/duration_minutes e.g., vp9/2500/60\n ${recordingTimeMsg}`, 'h264/2500/0.');

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
    if (!estimate.quota) return 'Unknown recording storage remaining.';
    const remainingMB = estimate.quota / 1024 / 1024;

    /**
     * h264 2500 kbps: 88 MB / 5min ~= 18 MB / min
     * h264 3000 kbps: 105 MB / 5min ~= 21 MB / min
     * h265 5000 kbps: 173 MB / 5min ~= 34.6 MB / min
     */
    const h264_2500_hours = (remainingMB / 18 / 60).toFixed(1);
    const h264_3000_hours = (remainingMB / 21 / 60).toFixed(1);
    const h264_5000_hours = (remainingMB / 34.6 / 60).toFixed(1);

    const msg = `You have ${(remainingMB / 1024).toFixed(1)}GB of storage remaining. For h264 codec this allows ${h264_2500_hours}h @ 2500kbps, ${h264_3000_hours}h @ 3000kbps, ${h264_5000_hours}h @ 5000kbps`;
    console.log(msg);
    return msg;
}