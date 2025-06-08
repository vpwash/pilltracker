import React, { createContext, useCallback, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Medication, MedicationLog } from '../db/db';
import { AppProviderProps, AppContextType, HistoricalMedicationLog } from './types';

// Create and export the context
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [selectedMedicationId, setSelectedMedicationId] = useState<number | null>(null);

  // --- Actions ---
  const selectProfile = useCallback((profileId: number | null) => {
    setSelectedProfileId(profileId);
    setSelectedMedicationId(null);
  }, []);

  const selectMedication = useCallback((medicationId: number | null) => {
    setSelectedMedicationId(medicationId);
  }, []);

  const addProfile = useCallback(async (name: string) => {
    try {
      return await db.profiles.add({ name });
    } catch {
      return undefined;
    }
  }, []);

  const deleteProfile = useCallback(async (profileId: number) => {
    try {
      await db.transaction('rw', db.profiles, db.medications, db.medicationLog, async () => {
        const medsToDelete = await db.medications
          .where('profileId')
          .equals(profileId)
          .toArray();
        const medIdsToDelete = medsToDelete.map((med) => med.id!);

        if (medIdsToDelete.length > 0) {
          await db.medicationLog
            .where('medicationId')
            .anyOf(medIdsToDelete)
            .delete();
        }

        await db.medications.where('profileId').equals(profileId).delete();
        await db.profiles.delete(profileId);

        if (selectedProfileId === profileId) {
          setSelectedProfileId(null);
        }
      });
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  }, [selectedProfileId]);

  const addMedication = useCallback(async (medication: Omit<Medication, 'id' | 'frequency'>) => {
    if (medication.profileId === null) return undefined;
    try {
      return await db.medications.add(medication as Medication);
    } catch (error) {
      console.error('Error adding medication:', error);
      return undefined;
    }
  }, []);

  const updateMedication = useCallback(async (medication: Medication) => {
    if (medication.id === undefined) return undefined;
    try {
      await db.medications.put(medication);
      return medication.id;
    } catch (error) {
      console.error('Error updating medication:', error);
      return undefined;
    }
  }, []);

  const deleteMedication = useCallback(async (medicationId: number) => {
    try {
      await db.transaction('rw', db.medications, db.medicationLog, async () => {
        await db.medicationLog.where('medicationId').equals(medicationId).delete();
        await db.medications.delete(medicationId);
      });
    } catch (error) {
      console.error('Error deleting medication:', error);
    }
  }, []);

  const logMedicationTaken = useCallback(async (medicationId: number, timestamp: number) => {
    try {
      return await db.medicationLog.add({ medicationId, timestamp });
    } catch (error) {
      console.error('Error logging medication:', error);
      return undefined;
    }
  }, []);

  const updateMedicationLog = useCallback(async (logId: number, updates: { timestamp: number }) => {
    try {
      await db.medicationLog.update(logId, {
        timestamp: updates.timestamp
      });
      return true;
    } catch (error) {
      console.error('Error updating medication log:', error);
      return false;
    }
  }, []);

  const deleteMedicationLog = useCallback(async (logId: number) => {
    try {
      await db.medicationLog.delete(logId);
      return true;
    } catch (error) {
      console.error('Error deleting medication log:', error);
      return false;
    }
  }, []);

  // --- Live Queries ---
  const profiles = useLiveQuery(() => db.profiles.toArray(), []);

  const selectedProfileMedications = useLiveQuery(
    async () => {
      if (selectedProfileId === null) return [];
      return db.medications.where('profileId').equals(selectedProfileId).toArray();
    },
    [selectedProfileId]
  );

  const medicationLogs = useLiveQuery(
    async () => {
      if (!selectedProfileMedications?.length) return new Map<number, MedicationLog[]>();
      
      const medicationIds = selectedProfileMedications.map(med => med.id!);
      const logs = await db.medicationLog
        .where('medicationId')
        .anyOf(medicationIds)
        .sortBy('timestamp');

      const logsMap = new Map<number, MedicationLog[]>();
      logs.forEach(log => {
        if (!logsMap.has(log.medicationId)) {
          logsMap.set(log.medicationId, []);
        }
        logsMap.get(log.medicationId)!.push(log);
      });

      return logsMap;
    },
    [selectedProfileMedications]
  );

  const historicalLogs = useLiveQuery<HistoricalMedicationLog[]>(
    async () => {
      if (!selectedProfileMedications?.length) return [];

      const medicationIds = selectedProfileMedications.map(med => med.id!);
      const logs = await db.medicationLog
        .where('medicationId')
        .anyOf(medicationIds)
        .sortBy('timestamp');

      const medicationMap = new Map<number, string>();
      selectedProfileMedications.forEach(med => {
        if (med.id) {
          medicationMap.set(med.id, med.name);
        }
      });

      return logs.map(log => ({
        id: log.id,
        medicationId: log.medicationId,
        medicationName: medicationMap.get(log.medicationId) || 'Unknown',
        timestamp: log.timestamp,
      }));
    },
    [selectedProfileMedications]
  ) as HistoricalMedicationLog[];

  const getLogsForMedication = useCallback((medicationId: number) => {
    return medicationLogs?.get(medicationId);
  }, [medicationLogs]);

  const contextValue = useMemo<AppContextType>(
    () => ({
      profiles: profiles || [],
      selectedProfileId,
      selectedProfileMedications: selectedProfileMedications || [],
      selectedMedicationId,
      medicationLogs: medicationLogs || new Map(),
      historicalLogs: historicalLogs || [],
      selectProfile,
      selectMedication,
      addProfile,
      deleteProfile,
      addMedication,
      updateMedication,
      deleteMedication,
      logMedicationTaken,
      updateMedicationLog,
      deleteMedicationLog,
      getLogsForMedication,
    }),
    [
      profiles,
      selectedProfileId,
      selectedProfileMedications,
      selectedMedicationId,
      medicationLogs,
      historicalLogs,
      selectProfile,
      selectMedication,
      addProfile,
      deleteProfile,
      addMedication,
      updateMedication,
      deleteMedication,
      logMedicationTaken,
      getLogsForMedication,
    ]
  ) as AppContextType;

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
