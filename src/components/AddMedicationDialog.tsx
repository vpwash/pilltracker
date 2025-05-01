import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Autocomplete,
  createFilterOptions, // Import createFilterOptions
} from '@mui/material'
import { useAppContext } from '../contexts/AppContext'
import medicationsData from '../data/medications.json' // Import medication data

interface AddMedicationDialogProps {
  open: boolean
  onClose: () => void
  profileId: number | null
}

const AddMedicationDialog: React.FC<AddMedicationDialogProps> = ({
  open,
  onClose,
  profileId,
}) => {
  const { addMedication } = useAppContext()
  const [selectedMedication, setSelectedMedication] = useState<{
    name: string
    brand: string
    dosage: string[]
  } | null>(null)
  const [medicationNameInput, setMedicationNameInput] = useState('')
  const [dose, setDose] = useState('')
  // Removed frequency state

  const handleAddMedication = async () => {
    if (selectedMedication && dose.trim() !== '' && profileId !== null) {
      await addMedication({
        profileId: profileId,
        name: selectedMedication.name,
        dose: dose.trim(),
        // Removed frequency from addMedication call
      })
      setSelectedMedication(null)
      setMedicationNameInput('')
      setDose('')
      // Removed frequency reset
      onClose()
    }
  }

  // Filter options for medication Autocomplete
  const filterOptions = createFilterOptions<{
    name: string
    brand: string
    dosage: string[]
  }>({
    limit: 10, // Limit to 10 suggestions
    matchFrom: 'any', // Match anywhere in the string
    // Stringify the option to include both name and brand for searching
    stringify: (option) => `${option.name} ${option.brand}`,
  })

  return (
    <Dialog
      open={open}
      onClose={onClose}
    >
      <DialogTitle>Add New Medication</DialogTitle>
      <DialogContent>
        <Autocomplete
          options={medicationNameInput ? medicationsData : []} // Show options only when typing
          filterOptions={filterOptions} // Apply custom filtering
          getOptionLabel={(option) => option.name}
          value={selectedMedication}
          onChange={(
            event: React.SyntheticEvent,
            newValue: { name: string; brand: string; dosage: string[] } | null
          ) => {
            setSelectedMedication(newValue)
            setDose('') // Reset dose when medication changes
          }}
          inputValue={medicationNameInput}
          onInputChange={(
            event: React.SyntheticEvent,
            newInputValue: string
          ) => {
            setMedicationNameInput(newInputValue)
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              autoFocus
              margin='dense'
              label='Medication Name'
              fullWidth
              sx={{ mb: 2 }}
            />
          )}
        />
        <Autocomplete
          options={selectedMedication ? selectedMedication.dosage : []}
          getOptionLabel={(option) => option}
          value={dose}
          onChange={(event: React.SyntheticEvent, newValue: string | null) => {
            setDose(newValue || '')
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              margin='dense'
              label='Dose'
              fullWidth
              sx={{ mb: 2 }}
            />
          )}
          disabled={!selectedMedication} // Disable dose until medication is selected
        />
        {/* Removed Frequency TextField */}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleAddMedication}
          disabled={!selectedMedication || dose.trim() === ''} // Removed frequency check
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddMedicationDialog
