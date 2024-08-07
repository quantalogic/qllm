export interface Spinner {
    start(): void;
    stop(): void;
    succeed(message?: string): void;
    fail(message?: string): void;
    isActive(): boolean;
}

export interface SpinnerFactory {
    createSpinner(text: string): Spinner;
}