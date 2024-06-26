import fs from 'fs';

export function logInfo(message: string): void {
  const logStream = fs.createWriteStream('cli.log', { flags: 'a' });
  const logMessage = `[INFO] ${new Date().toISOString()} - ${message}\n`;
  logStream.write(logMessage);
  logStream.end();
  
  // Also print to console, but prefix with a special character
  console.error(`ℹ️ ${message}`);
}

export function logError(message: string): void {
  const logStream = fs.createWriteStream('cli.log', { flags: 'a' });
  const logMessage = `[ERROR] ${new Date().toISOString()} - ${message}\n`;
  logStream.write(logMessage);
  logStream.end();
  
  // Also print to console, but prefix with a special character
  console.error(`❌ ${message}`);
}