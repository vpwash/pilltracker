import { ReactNode } from 'react';
import { Medication, MedicationLog, Profile } from '../db/db';

export interface HistoricalMedicationLog {
  id?: number;
  medicationId: number;
  medicationName: string;
  timestamp: number;
}

export interface AppContextType {
  profiles: Profile[] | undefined;
  selectedProfileId: number | null;
  selectedProfileMedications: Medication[] | undefined;
  selectedMedicationId: number | null;
  medicationLogs: Map<number, MedicationLog[]>;
  historicalLogs: HistoricalMedicationLog[];
  
  selectProfile: (profileId: number | null) => void;
  selectMedication: (medicationId: number | null) => void;
  addProfile: (name: string) => Promise<number | undefined>;
  deleteProfile: (profileId: number) => Promise<void>;
  addMedication: (medication: Omit<Medication, 'id' | 'frequency'>) => Promise<number | undefined>;
  updateMedication: (medication: Medication) => Promise<number | undefined>;
  deleteMedication: (medicationId: number) => Promise<void>;
  logMedicationTaken: (medicationId: number, timestamp: number) => Promise<number | undefined>;
  updateMedicationLog: (logId: number, updates: { timestamp: number }) => Promise<boolean>;
  deleteMedicationLog: (logId: number) => Promise<boolean>;
  getLogsForMedication: (medicationId: number) => MedicationLog[] | undefined;
}

export interface AppProviderProps {
  children: ReactNode;
}
