import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, Profile, Medication, MedicationLog } from '../db/db'
import type { HistoricalMedicationLog } from '../types';

// Define the shape of the context data
interface AppContextType {
  profiles: Profile[] | undefined
  selectedProfileId: number | null
  selectedProfileMedications: Medication[] | undefined
  selectedMedicationId: number | null // Add state for selected medication
  medicationLogs: Map<number, MedicationLog[]> // Map medicationId to its logs
  selectProfile: (profileId: number | null) => void
  selectMedication: (medicationId: number | null) => void // Add function to select medication
  addProfile: (name: string) => Promise<number | undefined>
  deleteProfile: (profileId: number) => Promise<void>
  addMedication: (
    medication: Omit<Medication, 'id' | 'frequency'> // Remove frequency from type
  ) => Promise<number | undefined>
  updateMedication: (medication: Medication) => Promise<number | undefined>
  deleteMedication: (medicationId: number) => Promise<void>
  logMedicationTaken: (medicationId: number) => Promise<number | undefined>
  getLogsForMedication: (medicationId: number) => MedicationLog[] | undefined;
  historicalMedicationData: HistoricalMedicationLog[];
  // addProfile: (name: string) => Promise<number | undefined> // Moved to inside the provider
}

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined)

// Define the provider component
interface AppProviderProps {
  children: ReactNode
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(
    null
  )
  const [selectedMedicationId, setSelectedMedicationId] = useState<
    number | null
  >(null)

  // --- Actions ---

  const selectProfile = useCallback((profileId: number | null) => {
    setSelectedProfileId(profileId)
    setSelectedMedicationId(null) // Deselect medication when profile changes
  }, [])

  const selectMedication = useCallback((medicationId: number | null) => {
    setSelectedMedicationId(medicationId)
  }, [])

  const addProfile = useCallback(async (name: string) => {
    try {
      const id = await db.profiles.add({ name })
      console.log(`Profile added with id: ${id}`)
      // Optionally select the new profile
      // selectProfile(id);
      return id
    } catch (error) {
      console.error('Failed to add profile:', error)
      return undefined
    }
  }, [])

  const deleteProfile = useCallback(
    async (profileId: number) => {
      try {
        await db.transaction(
          'rw',
          db.profiles,
          db.medications,
          db.medicationLog,
          async () => {
            // Find medications associated with the profile
            const medsToDelete = await db.medications
              .where('profileId')
              .equals(profileId)
              .toArray()
            const medIdsToDelete = medsToDelete.map((med) => med.id!)

            // Delete logs associated with those medications
            if (medIdsToDelete.length > 0) {
              await db.medicationLog
                .where('medicationId')
                .anyOf(medIdsToDelete)
                .delete()
            }

            // Delete medications
            await db.medications.where('profileId').equals(profileId).delete()

            // Delete the profile
            await db.profiles.delete(profileId)

            // If the deleted profile was selected, deselect it
            if (selectedProfileId === profileId) {
              setSelectedProfileId(null)
            }
          }
        )
        console.log(`Profile ${profileId} and associated data deleted.`)
      } catch (error) {
        console.error(`Failed to delete profile ${profileId}:`, error)
      }
    },
    [selectedProfileId]
  )

  const addMedication = useCallback(
    async (medication: Omit<Medication, 'id' | 'frequency'>) => {
      // Remove frequency from type
      console.log('AppContext: Received medication data:', medication);
      
      if (medication.profileId === null) {
        console.error('Cannot add medication without a selected profile.')
        return undefined
      }
      
      try {
        console.log('AppContext: About to add medication to database:', medication);
        const medicationToAdd = medication as Medication;
        console.log('AppContext: Converted medication object:', medicationToAdd);
        
        const id = await db.medications.add(medicationToAdd)
        console.log(`Medication added with id: ${id}, full data:`, medicationToAdd)
        return id
      } catch (error) {
        console.error('Failed to add medication:', error)
        return undefined
      }
    },
    []
  )

  const updateMedication = useCallback(async (medication: Medication) => {
    if (medication.id === undefined) {
      console.error('Cannot update medication without an ID.')
      return undefined
    }
    try {
      const id = await db.medications.put(medication)
      console.log(`Medication updated with id: ${id}`)
      return id
    } catch (error) {
      console.error(`Failed to update medication ${medication.id}:`, error)
      return undefined
    }
  }, [])

  const deleteMedication = useCallback(async (medicationId: number) => {
    try {
      await db.transaction('rw', db.medications, db.medicationLog, async () => {
        // Delete logs associated with the medication
        await db.medicationLog
          .where('medicationId')
          .equals(medicationId)
          .delete()
        // Delete the medication
        await db.medications.delete(medicationId)
      })
      console.log(`Medication ${medicationId} and associated logs deleted.`)
    } catch (error) {
      console.error(`Failed to delete medication ${medicationId}:`, error)
    }
  }, [])

  const logMedicationTaken = useCallback(async (medicationId: number) => {
    try {
      const timestamp = Date.now()
      const id = await db.medicationLog.add({ medicationId, timestamp })
      console.log(
        `Logged medication ${medicationId} taken at ${new Date(
          timestamp
        ).toLocaleString()}`
      )
      return id
    } catch (error) {
      console.error(`Failed to log medication ${medicationId} taken:`, error)
      return undefined
    }
  }, [])

  // --- Live Queries ---

  // Get all profiles
  const profiles = useLiveQuery(
    () => db.profiles.toArray(),
    [addProfile, deleteProfile]
  )

  // Get medications for the selected profile
  const selectedProfileMedications = useLiveQuery(
    () => {
      if (selectedProfileId === null) return []
      return db.medications
        .where('profileId')
        .equals(selectedProfileId)
        .toArray()
    },
    [selectedProfileId, addProfile, deleteProfile] // Re-run query when selectedProfileId changes
  )

  // Get logs for the medications of the selected profile
  const medicationLogs = useLiveQuery(
    async () => {
      if (
        !selectedProfileMedications ||
        selectedProfileMedications.length === 0
      ) {
        return new Map<number, MedicationLog[]>()
      }
      const medicationIds = selectedProfileMedications.map((med) => med.id!)
      const logs = await db.medicationLog
        .where('medicationId')
        .anyOf(medicationIds)
        .sortBy('timestamp') // Get logs sorted by time

      // Group logs by medicationId
      const logsMap = new Map<number, MedicationLog[]>()
      logs.forEach((log) => {
        if (!logsMap.has(log.medicationId)) {
          logsMap.set(log.medicationId, [])
        }
        logsMap.get(log.medicationId)!.push(log)
      })
      return logsMap
    },
    [selectedProfileMedications, logMedicationTaken] // Re-run when medications change or log function potentially involved
  )

  // Combine medication details with logs for historical view
  const historicalMedicationData = useMemo(() => {
    console.log('Calculating historicalMedicationData');
    console.log('selectedProfileMedications:', selectedProfileMedications);
    console.log('medicationLogs:', medicationLogs);
    
    if (!selectedProfileMedications || !medicationLogs) {
      console.log('Missing data for historical view:', { 
        hasMedications: !!selectedProfileMedications, 
        hasLogs: !!medicationLogs 
      });
      return [];
    }

    const historicalData: HistoricalMedicationLog[] = [];
    selectedProfileMedications.forEach(medication => {
      console.log('Processing medication:', medication);
      const logs = medicationLogs.get(medication.id!);
      console.log(`Logs for medication ${medication.name}:`, logs);
      
      if (logs && logs.length > 0) {
        logs.forEach(log => {
          historicalData.push({
            logId: log.id!,
            medicationId: medication.id!,
            medicationName: medication.name,
            medicationDose: medication.dose,
            timestamp: log.timestamp,
          });
        });
      }
    });
    
    console.log('Final historicalData:', historicalData);
    // Sort by timestamp descending (most recent first)
    return historicalData.sort((a, b) => b.timestamp - a.timestamp);
  }, [selectedProfileMedications, medicationLogs]);

  const getLogsForMedication = useCallback(
    (medicationId: number) => {
      return medicationLogs?.get(medicationId)
    },
    [medicationLogs]
  )

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      profiles,
      selectedProfileId,
      selectedProfileMedications,
      selectedMedicationId, // Include selectedMedicationId
      medicationLogs: medicationLogs || new Map(), // Ensure it's always a Map
      selectProfile,
      selectMedication, // Include selectMedication
      addProfile,
      deleteProfile,
      addMedication,
      updateMedication,
      deleteMedication,
      logMedicationTaken,
      getLogsForMedication,
      historicalMedicationData,
    }),
    [
      profiles,
      selectedProfileId,
      selectedProfileMedications,
      selectedMedicationId, // Include selectedMedicationId
      medicationLogs,
      selectProfile,
      selectMedication, // Include selectMedication
      addProfile,
      deleteProfile,
      addMedication,
      updateMedication,
      deleteMedication,
      logMedicationTaken,
      getLogsForMedication,
      historicalMedicationData,
    ] // Ensure logMedicationTaken is included if it's added above
  )

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  )
}

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}
