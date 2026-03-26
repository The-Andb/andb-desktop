/**
 * SafeLogger
 * 
 * A wrapper around console methods to prevent "Error: write EPIPE" crashes
 * in production when stdout/stderr pipes are closed.
 */
export class SafeLogger {
  private static isEPIPE(error: any): boolean {
    return error && error.code === 'EPIPE';
  }

  public static log(...args: any[]): void {
    try {
      console.log(...args);
    } catch (error) {
      if (!this.isEPIPE(error)) throw error;
    }
  }

  public static info(...args: any[]): void {
    try {
      console.info(...args);
    } catch (error) {
      if (!this.isEPIPE(error)) throw error;
    }
  }

  public static warn(...args: any[]): void {
    try {
      console.warn(...args);
    } catch (error) {
      if (!this.isEPIPE(error)) throw error;
    }
  }

  public static error(...args: any[]): void {
    try {
      console.error(...args);
    } catch (error) {
      if (!this.isEPIPE(error)) throw error;
    }
  }

  public static debug(...args: any[]): void {
    try {
      console.debug(...args);
    } catch (error) {
      if (!this.isEPIPE(error)) throw error;
    }
  }
}

export default SafeLogger;
