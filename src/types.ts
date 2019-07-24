export enum Commands {
    PromptConfig = 'PromptConfig',
    ReturnConfig = 'ReturnConfig'
}

export interface Codecs {
    webm: string;
    vp8: string;
    vp9: string;
    h264: string;
}

export interface UserConfig {
    encoder: keyof Codecs;
    bitrateKbps: number;
    durationMinutes: number;
}

// Helper function printing numbers with one decimal place and commas for each thousand
export function nn(num: number) {
    return parseFloat(num.toFixed(1)).toLocaleString();
}