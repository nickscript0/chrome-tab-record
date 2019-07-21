import { UserConfig, Commands, Codecs } from './types';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(`content.ts listener added!`);
    if (request.command === Commands.PromptConfig) {
        console.log(`content.ts got command to promptconfig!`);
        const config = promptConfig();
        chrome.runtime.sendMessage({ command: Commands.ReturnConfig, data: config });
    }
    sendResponse(null);
});

function promptConfig(): UserConfig {
    const configStr = window.prompt(`Input encoder/bitrate_kbps/duration_minutes e.g., vp9/2500/60`, 'h264/2500/0');

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