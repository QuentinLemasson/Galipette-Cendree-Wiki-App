export class Analytics {
  logEvent(eventName: string, data: Record<string, unknown>): void {
    // Implement your analytics logic here
    console.log(`Analytics event: ${eventName}`, data);
  }
}
