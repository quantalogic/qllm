import { promises as fs } from "fs";
import * as path from "path";

export async function writeToFile(
    filePath: string,
    content: string,
    options: {
        encoding?: BufferEncoding;
        mode?: number;
        flag?: string;
    } = {},
): Promise<void> {
    if (typeof filePath !== "string" || filePath.trim().length === 0) {
        throw new Error("Invalid file path");
    }

    if (typeof content !== "string") {
        throw new Error("Content must be a string");
    }

    const { encoding = "utf8", mode = 0o666, flag = "w" } = options;

    let fileHandle: fs.FileHandle | null = null;
    try {
        // Ensure the directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });

        fileHandle = await fs.open(filePath, flag, mode);
        await fileHandle.writeFile(content, { encoding });
    } catch (error) {
        throw error;
    } finally {
        if (fileHandle) {
            try {
                await fileHandle.close();
            } catch (closeError) {}
        }
    }
}
