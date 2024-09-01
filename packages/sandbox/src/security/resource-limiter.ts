import { ResourceLimits, ResourceUsageStats } from '../types';

/**
 * Class for managing and enforcing resource limits during execution
 */
export class ResourceLimiter {
    private startTime: number;
    private maxMemory: number;
    private memoryCheckInterval: NodeJS.Timeout | null = null;
  
    /**
     * Creates a new ResourceLimiter instance
     * @param {ResourceLimits} limits - The resource limits to enforce
     */
    constructor(private limits: ResourceLimits) {
      this.startTime = Date.now();
      this.maxMemory = 0;
    }
  
    /**
     * Enforces the specified resource limits
     * @returns {NodeJS.Timeout | null} A timeout object if execution time limit is set, null otherwise
     */
    enforceLimits(): NodeJS.Timeout | null {
        // Enforce execution time limit
        if (this.limits.maxExecutionTime) {
          return setTimeout(() => {
            throw new Error('Execution time limit exceeded');
          }, this.limits.maxExecutionTime);
        }
    
        // Enforce memory usage limit
        if (this.limits.maxMemory) {
          this.memoryCheckInterval = setInterval(() => {
            const memoryUsage = process.memoryUsage().heapUsed;
            if (this.limits.maxMemory && memoryUsage > this.limits.maxMemory) {
              this.clearLimits();
              throw new Error('Memory limit exceeded');
            }
            this.maxMemory = Math.max(this.maxMemory, memoryUsage);
          }, 100);  // Check every 100ms
        }
    
        return null;
      }
    
    /**
     * Clears any active resource limit checks
     */
    clearLimits(): void {
        if (this.memoryCheckInterval) {
          clearInterval(this.memoryCheckInterval);
        }
      }
      
    /**
     * Monitors resource usage (placeholder for implementation)
     */
    monitorUsage(): void {
        // Implementation depends on specific monitoring requirements
    }

    /**
     * Retrieves current resource usage statistics
     * @returns {ResourceUsageStats} Object containing execution time and max memory usage
     */
    getUsageStats(): ResourceUsageStats {
        return {
          executionTime: Date.now() - this.startTime,
          maxMemoryUsage: this.maxMemory,
        };
    }
}