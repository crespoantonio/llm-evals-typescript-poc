/**
 * Logging system for evaluation runs and results
 */

import * as fs from 'fs';
import * as path from 'path';
import { LogEvent } from './types';

export class Logger {
  private events: Map<string, LogEvent[]> = new Map();

  /**
   * Log an event for a specific run
   */
  async logEvent(event: LogEvent): Promise<void> {
    const runEvents = this.events.get(event.run_id) || [];
    runEvents.push(event);
    this.events.set(event.run_id, runEvents);
  }

  /**
   * Get all events for a specific run
   */
  getEvents(runId: string): LogEvent[] {
    return this.events.get(runId) || [];
  }

  /**
   * Save events to a JSONL file
   */
  async saveToFile(filePath: string, runId?: string): Promise<void> {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let allEvents: LogEvent[] = [];
    
    if (runId) {
      allEvents = this.getEvents(runId);
    } else {
      // Save all events from all runs
      for (const events of this.events.values()) {
        allEvents.push(...events);
      }
    }

    // Sort events by run_id and event_id
    allEvents.sort((a, b) => {
      if (a.run_id !== b.run_id) {
        return a.run_id.localeCompare(b.run_id);
      }
      return a.event_id - b.event_id;
    });

    const jsonlContent = allEvents
      .map(event => JSON.stringify(event))
      .join('\n');

    fs.writeFileSync(filePath, jsonlContent);
  }

  /**
   * Load events from a JSONL file
   */
  async loadFromFile(filePath: string): Promise<void> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Log file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const event = JSON.parse(line) as LogEvent;
        await this.logEvent(event);
      } catch (error) {
        console.warn(`Failed to parse log line: ${line}`);
      }
    }
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events.clear();
  }

  /**
   * Get summary statistics from events
   */
  getSummary(runId: string): {
    total_samples: number;
    correct: number;
    incorrect: number;
    score: number;
    duration_ms?: number;
  } {
    const events = this.getEvents(runId);
    const metricsEvents = events.filter(e => e.type === 'metrics');
    const finalReportEvent = events.find(e => e.type === 'final_report');

    if (finalReportEvent) {
      return finalReportEvent.data as any;
    }

    // Calculate from individual metric events
    const total_samples = metricsEvents.length;
    const correct = metricsEvents.filter(e => e.data.passed === true).length;
    const incorrect = total_samples - correct;
    const score = total_samples > 0 ? correct / total_samples : 0;

    return {
      total_samples,
      correct,
      incorrect,
      score,
    };
  }

  /**
   * Generate a default log file path
   */
  static generateLogPath(runId: string, model: string, evalName: string): string {
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const logsDir = path.join(process.cwd(), 'logs');
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Sanitize model name for Windows file system (replace : with -)
    const sanitizedModel = model.replace(/[:<>"|?*]/g, '-').replace(/\//g, '-');
    const sanitizedEval = evalName.replace(/[:<>"|?*]/g, '-');

    return path.join(logsDir, `${runId}_${sanitizedModel}_${sanitizedEval}.jsonl`);
  }
}
