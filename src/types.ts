// This file will contain shared TypeScript interfaces and types for the application.

// Define the shape for historical medication data
export interface HistoricalMedicationLog {
  logId: number;
  medicationId: number;
  medicationName: string;
  medicationDose: string;
  timestamp: number;
}
