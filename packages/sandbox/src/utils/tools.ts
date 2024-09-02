import { readFileSync, readdirSync } from 'fs';
import path from 'path'; 
import { FileInput } from '../types';

/**
 * Recursively retrieves all files from a directory and its subdirectories
 * @param {string} dir - The directory path to start from
 * @returns {Promise<FileInput[]>} A promise that resolves to an array of FileInput objects
 */
export async function getFilesFromDirectory(dir: string): Promise<FileInput[]> {
    const files: FileInput[] = [];
    // Read the contents of the directory
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // If it's a directory, recursively call the function
        files.push(...await getFilesFromDirectory(fullPath));
      } else if (entry.isFile() && entry.name !== 'package.json') {
        // If it's a file (excluding package.json), add it to the files array
        files.push({
          name: path.relative(dir, fullPath),
          content: readFileSync(fullPath, 'utf-8')
        });
      }
    }
    return files;
}

/**
 * Retrieves file inputs based on command-line arguments
 * @param {any} argv - The parsed command-line arguments
 * @returns {Promise<FileInput[]>} A promise that resolves to an array of FileInput objects
 */
export async function getFileInputs(argv: any): Promise<FileInput[]> {
    if (argv.f) {
      // If individual files are specified
      return argv.f.map((f: string) => ({
        name: path.basename(f),
        content: readFileSync(path.resolve(f), 'utf-8')
      }));
    }
    // If a directory is specified
    return getFilesFromDirectory(path.resolve(argv.dir));
  }