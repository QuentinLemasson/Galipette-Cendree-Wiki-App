import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

type LogOptions = {
  consolePrint?: boolean;
  timestampPrint?: boolean;
};

export class Logger {
  private logStream: fs.WriteStream;
  private logPath: string;
  private operation: string;

  constructor(filename: string, operation: string = "Unknown Operation") {
    this.operation = operation;
    // Ensure the logs directory exists
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const logsDir = path.join(__dirname, "..", "..", "..", "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    this.logPath = path.join(logsDir, filename);

    // Clear existing log file
    fs.writeFileSync(this.logPath, "");

    // Open stream in append mode
    this.logStream = fs.createWriteStream(this.logPath, { flags: "a" });

    // Write header with formatted timestamp
    this.log("=".repeat(50), { consolePrint: false });
    this.log(`${operation} started at: ${this.formatTimestamp(new Date())}`, {
      consolePrint: false,
    });
    this.log("=".repeat(50) + "\n", { consolePrint: false });
  }

  private formatTimestamp(date: Date): string {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${day}/${month}/${year}-${hours}:${minutes}:${seconds}`;
  }

  log(
    message: string,
    options: LogOptions = { consolePrint: true, timestampPrint: true }
  ) {
    let logMessage = "";
    if (options.timestampPrint) {
      const timestamp = this.formatTimestamp(new Date());
      logMessage = `[${timestamp}] ${message}\n`;
    } else {
      logMessage = `${message}\n`;
    }

    // Write to file
    this.logStream.write(logMessage);

    // Also print to console
    if (options.consolePrint) {
      console.log(message);
    }
  }

  error(message: string, error?: Error) {
    const errorMessage = error ? `${message}: ${error.message}` : message;
    const logMessage = `❌ ERROR: ${errorMessage}`;

    if (error?.stack) {
      this.log(logMessage);
      this.log("Stack trace:");
      this.log(error.stack);
    } else {
      this.log(logMessage);
    }
  }

  success(message: string) {
    this.log(`✅ ${message}`);
  }

  info(message: string, icon: string = "ℹ️") {
    this.log(`${icon} ${message}`);
  }

  warn(message: string, error?: Error) {
    const errorMessage = error ? `${message}: ${error.message}` : message;
    const logMessage = `⚠️ WARNING: ${errorMessage}`;

    this.log(logMessage);
  }

  section(message: string) {
    this.log(
      `\n<${"=".repeat(15)}${" ".repeat(5)}${message}${" ".repeat(5)}${"=".repeat(15)}>\n`,
      { consolePrint: false }
    );
  }

  close() {
    this.log("=".repeat(50), { consolePrint: false });
    this.log(
      `${this.operation} finished at: ${this.formatTimestamp(new Date())}`,
      { consolePrint: false }
    );
    this.log("=".repeat(50) + "\n", { consolePrint: false });
    this.logStream.end();
  }
}
