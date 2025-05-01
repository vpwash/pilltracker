import Dexie, { Table } from 'dexie'

// 1. Define Database Interfaces

export interface Profile {
  id?: number // Primary key. Optional (assigned by Dexie)
  name: string
}

export interface Medication {
  id?: number // Primary key. Optional
  profileId: number // Foreign key to Profile table
  name: string
  dose: string // e.g., "500mg", "1 tablet"
  // frequency: string // Removed frequency
}

export interface MedicationLog {
  id?: number // Primary key. Optional
  medicationId: number // Foreign key to Medication table
  timestamp: number // Milliseconds since epoch when dose was taken
}

// 2. Define Database Class
export class PillTrackerDB extends Dexie {
  // Declare tables
  profiles!: Table<Profile, number> // number = type of the primary key (id)
  medications!: Table<Medication, number>
  medicationLog!: Table<MedicationLog, number>

  constructor() {
    super('PillTrackerDB') // Database name
    this.version(1).stores({
      // Schema definition - Version 1
      profiles: '++id, name',
      medications: '++id, profileId, name, frequency', // Added frequency for v1
      medicationLog: '++id, medicationId, timestamp',
    })
    this.version(2).stores({
      // Schema definition - Version 2 (Removed frequency)
      profiles: '++id, name', // Keep profiles schema
      medications: '++id, profileId, name', // Remove frequency index/property
      medicationLog: '++id, medicationId, timestamp', // medicationId and timestamp are indexed
    })

    // Map table names to interfaces (optional but good for type safety)
    this.profiles = this.table('profiles')
    this.medications = this.table('medications')
    this.medicationLog = this.table('medicationLog')
  }
}

// 3. Export a singleton instance
export const db = new PillTrackerDB()
