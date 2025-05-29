import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Autocomplete,
  createFilterOptions,
} from '@mui/material'
import { useAppContext } from '../contexts/useAppContext'
import medicationsData from '../data/medications.json'

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

  const handleAddMedication = async () => {
    // Only use default dose if the field is truly empty
    const currentDose = dose.trim() === '' ? 'none' : dose;
    
    if (medicationNameInput.trim() !== '' && profileId !== null) {
      try {
        const medicationToAdd = {
          profileId: profileId,
          name: medicationNameInput.trim(),
          dose: currentDose,
        };
        
        await addMedication(medicationToAdd);
        
        // Clear inputs and close dialog
        setSelectedMedication(null);
        setMedicationNameInput('');
        setDose('');
        onClose();
      } catch {
        // Error adding medication
      }
    } else {
      // Missing required medication fields
      console.warn('Missing required fields:', {
        medicationName: medicationNameInput.trim(), 
        dose: dose.trim(), 
        profileId 
      });
    }
  }

  const filterOptions = createFilterOptions<{
    name: string
    brand: string
    dosage: string[]
  }>({
    limit: 10,
    matchFrom: 'any',
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
          freeSolo
          options={medicationNameInput ? medicationsData : []}
          filterOptions={filterOptions}
          getOptionKey={(option) => typeof option === 'string' ? option : `${option.name}-${option.brand}`}
          getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
          value={selectedMedication}
          onChange={(
            _event: React.SyntheticEvent,
            newValue: string | { name: string; brand: string; dosage: string[] } | null
          ) => {
            if (typeof newValue === 'string') {
              setSelectedMedication({ name: newValue, brand: '', dosage: [] })
              // Ensure medicationNameInput is updated when a string is selected
              setMedicationNameInput(newValue)
            } else {
              setSelectedMedication(newValue)
              // Update medicationNameInput when an option is selected
              if (newValue) {
                setMedicationNameInput(newValue.name)
              }
            }
          }}
          inputValue={medicationNameInput}
          onInputChange={(
            _event: React.SyntheticEvent,
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
          freeSolo
          options={selectedMedication ? selectedMedication.dosage : []}
          getOptionLabel={(option) => typeof option === 'string' ? option : option}
          value={dose}
          onChange={(_event: React.SyntheticEvent, newValue: string | null) => {
            // Dose changed
            setDose(newValue || '')
          }}
          onInputChange={(_event, newInputValue) => {
            // Dose input changed
            setDose(newInputValue);
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
          disabled={!medicationNameInput}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleAddMedication}
          disabled={false}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddMedicationDialog
