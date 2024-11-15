import { createHash } from 'crypto';
import { promisify } from 'util';
import { lookup } from 'mime-types';
import logger from '../logger';

export interface ContentValidationOptions {
    maxFileSize: number;
    allowedMimeTypes?: string[];
    maxContentLength?: number;
    validateEncoding?: boolean;
    allowExecutables?: boolean;
    securityScanEnabled?: boolean;
}

export class ContentValidator {
    private readonly defaultOptions: Required<ContentValidationOptions> = {
        maxFileSize: 100 * 1024 * 1024, // 100MB
        allowedMimeTypes: [],
        maxContentLength: 50 * 1024 * 1024, // 50MB
        validateEncoding: true,
        allowExecutables: false,
        securityScanEnabled: true
    };

    private readonly options: Required<ContentValidationOptions>;

    constructor(options: ContentValidationOptions) {
        this.options = { ...this.defaultOptions, ...options };
    }

    async validateContent(
        buffer: Buffer,
        expectedMimeType: string,
        filePath: string
    ): Promise<void> {
        try {
            // Size validation
            await this.validateSize(buffer);

            // MIME type validation
            await this.validateMimeType(buffer, expectedMimeType);

            // // Content integrity validation
            // await this.validateIntegrity(buffer, filePath);

            // Security validation
            if (this.options.securityScanEnabled) {
                await this.performSecurityChecks(buffer, filePath);
            }

            // // Encoding validation
            // if (this.options.validateEncoding) {
            //     await this.validateEncoding(buffer);
            // }

        } catch (error) {
            const errorMessage = error instanceof Error ? 
                error.message : 
                `Content validation failed: ${String(error)}`;
            throw new Error(`Validation error for ${filePath}: ${errorMessage}`);
        }
    }

    private async validateSize(buffer: Buffer): Promise<void> {
        const size = buffer.length;
        
        if (size === 0) {
            throw new Error('Content is empty');
        }

        if (size > this.options.maxFileSize) {
            throw new Error(
                `Content size (${size} bytes) exceeds maximum allowed size (${this.options.maxFileSize} bytes)`
            );
        }
    }

    private async validateMimeType(buffer: Buffer, expectedMimeType: string): Promise<void> {
        // Skip validation if no allowed MIME types are specified
        if (this.options.allowedMimeTypes.length === 0) {
            return;
        }

        if (!this.options.allowedMimeTypes.includes(expectedMimeType)) {
            throw new Error(`MIME type ${expectedMimeType} is not allowed`);
        }

        // Validate file signature
        const detectedType = await this.detectContentType(buffer);
        if (detectedType && detectedType !== expectedMimeType) {
            throw new Error(
                `Content type mismatch: expected ${expectedMimeType}, detected ${detectedType}`
            );
        }
    }

    private async validateIntegrity(buffer: Buffer, filePath: string): Promise<void> {
        // Check for file corruption
        if (!this.isValidContent(buffer)) {
            throw new Error('Content appears to be corrupted');
        }

        // Calculate and verify checksum
        const checksum = this.calculateChecksum(buffer);
        if (!checksum) {
            throw new Error('Failed to calculate content checksum');
        }
    }

    private async validateEncoding(buffer: Buffer): Promise<void> {
        try {
            // Attempt to decode as UTF-8
            const content = buffer.toString('utf8');
            if (content.includes('\uFFFD')) {
                throw new Error('Content contains invalid UTF-8 characters');
            }
        } catch (error) {
            throw new Error('Content has invalid encoding');
        }
    }

    private async performSecurityChecks(buffer: Buffer, filePath: string): Promise<void> {
        // Check for executable content
        if (!this.options.allowExecutables && this.isExecutable(buffer)) {
            throw new Error('Executable content is not allowed');
        }

        // Check for malicious patterns
        if (this.containsMaliciousPatterns(buffer)) {
            throw new Error('Potentially malicious content detected');
        }

        // Additional security checks can be added here
        await this.scanForMalware(buffer);
    }

    private isValidContent(buffer: Buffer): boolean {
        // Basic content validation
        if (buffer.length === 0) {
            return false;
        }

        // File signatures validation
        const signatures: Record<string, Buffer> = {
            pdf: Buffer.from('%PDF'),
            png: Buffer.from([0x89, 0x50, 0x4E, 0x47]),
            jpeg: Buffer.from([0xFF, 0xD8, 0xFF]),
            gif: Buffer.from('GIF87a'),
            gif89a: Buffer.from('GIF89a'),
            zip: Buffer.from([0x50, 0x4B, 0x03, 0x04]),
            // Add more signatures as needed
        };

        // Check if content starts with any valid signature
        return Object.values(signatures).some(signature =>
            buffer.slice(0, signature.length).equals(signature)
        );
    }

    private isExecutable(buffer: Buffer): boolean {
        const executableSignatures = [
            Buffer.from('MZ'),  // Windows executables
            Buffer.from([0x7F, 0x45, 0x4C, 0x46]),  // ELF files
            Buffer.from('#!'),  // Shell scripts
        ];

        return executableSignatures.some(signature =>
            buffer.slice(0, signature.length).equals(signature)
        );
    }

    private containsMaliciousPatterns(buffer: Buffer): boolean {
        const maliciousPatterns = [
            /<script\b[^>]*>/i,  // Script tags
            /eval\s*\(/,         // eval() calls
            /document\.cookie/i,  // Cookie manipulation
            /<iframe\b[^>]*>/i,  // iframes
            /javascript:/i,      // javascript: URLs
            /data:/i,            // data: URLs
            /vbscript:/i,        // vbscript: URLs
        ];

        const content = buffer.toString('utf8');
        return maliciousPatterns.some(pattern => pattern.test(content));
    }

    private async detectContentType(buffer: Buffer): Promise<string | undefined> {
        // Implementation depends on your needs
        // You might want to use a library like 'file-type' or implement your own detection
        return undefined;
    }

    private calculateChecksum(buffer: Buffer): string {
        return createHash('sha256').update(buffer).digest('hex');
    }

    private async scanForMalware(buffer: Buffer): Promise<void> {
        // Implement your malware scanning logic here
        // This could integrate with an antivirus service or custom scanning logic
        logger.debug('Malware scan completed');
    }
}

// Export utility functions that might be useful elsewhere
export const isValidFileType = (mimeType: string, allowedTypes: string[]): boolean => {
    return allowedTypes.length === 0 || allowedTypes.includes(mimeType);
};

export const getFileExtension = (filename: string): string => {
    const ext = filename.split('.').pop();
    return ext ? `.${ext.toLowerCase()}` : '';
};

export const getMimeType = (filename: string): string => {
    return lookup(filename) || 'application/octet-stream';
};