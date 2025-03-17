import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export class Logger {
  private logStream: fs.WriteStream;
  private logPath: string;

  constructor(filename: string) {
    // Ensure the logs directory exists
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const logsDir = path.join(__dirname, "..", "script-logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    this.logPath = path.join(logsDir, filename);

    // Clear existing log file
    fs.writeFileSync(this.logPath, "");

    // Open stream in append mode
    this.logStream = fs.createWriteStream(this.logPath, { flags: "a" });

    // Write header with formatted timestamp
    this.log("=".repeat(50), false);
    this.log(`Import started at: ${this.formatTimestamp(new Date())}`, false);
    this.log("=".repeat(50) + "\n", false);
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

  log(message: string, consolePrint: boolean = true) {
    const timestamp = this.formatTimestamp(new Date());
    const logMessage = `[${timestamp}] ${message}\n`;

    // Write to file
    this.logStream.write(logMessage);

    // Also print to console
    if (consolePrint) {
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

  close() {
    this.log("=".repeat(50), false);
    this.log(`Import finished at: ${this.formatTimestamp(new Date())}`, false);
    this.log("=".repeat(50) + "\n", false);
    this.logStream.end();
  }
}
