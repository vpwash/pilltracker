import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material'
import { Medication } from '../db/db'
import { useAppContext } from '../contexts/AppContext'

interface EditMedicationDialogProps {
  open: boolean
  onClose: () => void
  medication: Medication | null
}

const EditMedicationDialog: React.FC<EditMedicationDialogProps> = ({
  open,
  onClose,
  medication,
}) => {
  const { updateMedication } = useAppContext()
  const [medicationName, setMedicationName] = useState('')
  const [dose, setDose] = useState('')
  // Removed frequency state

  useEffect(() => {
    if (medication) {
      setMedicationName(medication.name)
      setDose(medication.dose)
      // Removed frequency setter
    } else {
      setMedicationName('')
      setDose('')
      // Removed frequency setter
    }
  }, [medication])

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
        {/* Removed Frequency TextField */}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSaveMedication}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditMedicationDialog
