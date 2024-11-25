/**
 * @fileoverview Type definitions for file handling operations in the QLLM library.
 * This file defines the interface for file system operations used throughout the library.
 * 
 * @version 1.0.0
 * @license MIT
 */

/**
 * Interface for handling file system operations
 * Provides methods for reading, checking existence, and determining file types
 */
export interface FileHandler {
    /**
     * Reads the contents of a file
     * @param path - Path to the file to read
     * @returns Promise resolving to the file contents as a string
     */
    read(path: string): Promise<string>;

    /**
     * Checks if a file exists
     * @param path - Path to check for existence
     * @returns Promise resolving to true if file exists, false otherwise
     */
    exists(path: string): Promise<boolean>;

    /**
     * Gets the MIME type or content type of a file
     * @param path - Path to the file to check
     * @returns Promise resolving to the file's content type
     */
    getType(path: string): Promise<string>;
}