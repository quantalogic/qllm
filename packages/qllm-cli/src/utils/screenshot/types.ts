// interfaces.ts

export interface CaptureOptions {
    windowName?: string;
    interactive?: boolean;
    fullScreen?: boolean;
    clipboard?: boolean;
    mainMonitorOnly?: boolean;
    displayNumber?: number;
    captureMouseCursor?: boolean;
}

export interface Window {
    name: string;
    id: string;
    app: string;
}

export interface Screen {
    id: string;
    type: string;
    resolution: string;
}

export interface ScreenshotCapture {
    initialize(): Promise<void>;
    captureAndGetBase64(options: CaptureOptions): Promise<string | null>;
    listWindows(): Promise<Window[]>;
    listScreens(): Promise<Screen[]>;
    cleanupTempDir(): Promise<void>;
}

export interface ScreenshotCaptureOptions {
    maxRetries?: number;
    retryDelay?: number;
}
