export const processAndExit = (f: (...args: any[]) => void | Promise<void>): ((...args: any[]) => Promise<void>) => {
    return async (...args: any[]) => {
      try {
        await f(...args);
        process.exit(0);
      } catch (error) {
        console.error("An error occurred:", error);
        process.exit(1);
      }
    };
  }