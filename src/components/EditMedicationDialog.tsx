import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material'
import { Medication, MedicationLog } from '../db/db'
import { useAppContext } from '../contexts/AppContext'
import { db } from '../db/db'

interface EditMedicationDialogProps {
  open: boolean
  onClose: () => void
  medication: Medication | null
  medicationLog?: MedicationLog | null
}

const EditMedicationDialog: React.FC<EditMedicationDialogProps> = ({
  open,
  onClose,
  medication,
  medicationLog,
}) => {
  const { updateMedication, getLogsForMedication } = useAppContext()
  const [medicationName, setMedicationName] = useState('')
  const [dose, setDose] = useState('')
  const [timestamp, setTimestamp] = useState('')

  useEffect(() => {
    if (medication) {
      setMedicationName(medication.name)
      setDose(medication.dose)
      
      // If we have a medication log, set the timestamp
      if (medicationLog) {
        // Convert timestamp to local datetime-local format
        const date = new Date(medicationLog.timestamp)
        const localDatetime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
          .toISOString()
          .slice(0, 16) // Format as YYYY-MM-DDTHH:MM
        setTimestamp(localDatetime)
      } else {
        // If no log is provided but medication exists, get the most recent log
        const logs = getLogsForMedication(medication.id || 0)
        if (logs && logs.length > 0) {
          // Sort logs by timestamp in descending order and get the most recent
          const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp)
          const mostRecentLog = sortedLogs[0]
          const date = new Date(mostRecentLog.timestamp)
          const localDatetime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
            .toISOString()
            .slice(0, 16) // Format as YYYY-MM-DDTHH:MM
          setTimestamp(localDatetime)
        } else {
          // No logs, set current time
          const now = new Date()
          const localDatetime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
            .toISOString()
            .slice(0, 16) // Format as YYYY-MM-DDTHH:MM
          setTimestamp(localDatetime)
        }
      }
    } else {
      setMedicationName('')
      setDose('')
      setTimestamp('')
    }
  }, [medication, medicationLog, getLogsForMedication])

  const handleSaveMedication = async () => {
    if (medication && medicationName.trim() !== '') {
      // Ensure medication object conforms to the updated Medication type (without frequency)
      // Removed frequency from destructuring as it no longer exists
      const { id, profileId } = medication // Keep necessary fields
      await updateMedication({
        id, // Keep the id
        profileId, // Keep the profileId
        name: medicationName.trim(),
        dose: dose.trim(),
        // Removed frequency property
      })
      
      // If we have a timestamp and a medication log, update the timestamp
      if (timestamp && medicationLog && medicationLog.id) {
        const newTimestamp = new Date(timestamp).getTime()
        await db.updateMedicationTime(medicationLog.id, newTimestamp)
      } else if (timestamp && medication.id) {
        // If no specific log was provided but we have a timestamp and medication id,
        // get the most recent log and update it
        const logs = getLogsForMedication(medication.id)
        if (logs && logs.length > 0) {
          // Sort logs by timestamp in descending order and get the most recent
          const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp)
          const mostRecentLog = sortedLogs[0]
          if (mostRecentLog.id) {
            const newTimestamp = new Date(timestamp).getTime()
            await db.updateMedicationTime(mostRecentLog.id, newTimestamp)
          }
        }
      }
      
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
    >
      <DialogTitle>Edit Medication</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin='dense'
          label='Medication Name'
          type='text'
          fullWidth
          value={medicationName}
          onChange={(e) => setMedicationName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          margin='dense'
          label='Dose'
          type='text'
          fullWidth
          value={dose}
          onChange={(e) => setDose(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          margin='dense'
          label='Date and Time Taken'
          type='datetime-local'
          fullWidth
          value={timestamp}
          onChange={(e) => setTimestamp(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ mb: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSaveMedication}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditMedicationDialog
