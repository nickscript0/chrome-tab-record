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