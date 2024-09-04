import { promises as fs } from "fs";
import * as path from "path";

export async function writeToFile(
    filePath: string,
    content: string,
    options: {
        encoding?: BufferEncoding;
        mode?: number;
        flag?: string;
        append?: boolean;
    } = {},
): Promise<void> {
    if (typeof filePath !== "string" || filePath.trim().length === 0) {
        throw new Error("Invalid file path");
    }

    if (typeof content !== "string") {
        throw new Error("Content must be a string");
    }

    const { encoding = "utf8", mode = 0o666, append = false } = options;
    const flag = append ? "a" : "w";

    let fileHandle: fs.FileHandle | null = null;
    try {
        // Ensure the directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });

        fileHandle = await fs.open(filePath, flag, mode);
        await fileHandle.writeFile(content, { encoding });
    } finally {
        if (fileHandle) {
            try {
                await fileHandle.close();
            } catch (closeError) {
                // Handle close error if needed
            }
        }
    }
}

export async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true; // File exists
    } catch {
        return false; // File does not exist
    }
}
