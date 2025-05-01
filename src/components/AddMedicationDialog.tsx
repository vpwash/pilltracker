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
import { useAppContext } from '../contexts/AppContext'
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
    if (selectedMedication && dose.trim() !== '' && profileId !== null) {
      await addMedication({
        profileId: profileId,
        name: selectedMedication.name,
        dose: dose.trim(),
      })
      setSelectedMedication(null)
      setMedicationNameInput('')
      setDose('')
      onClose()
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
          options={medicationNameInput ? medicationsData : []}
          filterOptions={filterOptions}
          getOptionLabel={(option) => option.name}
          value={selectedMedication}
          onChange={(
            _event: React.SyntheticEvent,
            newValue: { name: string; brand: string; dosage: string[] } | null
          ) => {
            setSelectedMedication(newValue)
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
          options={selectedMedication ? selectedMedication.dosage : []}
          getOptionLabel={(option) => option}
          value={dose}
          onChange={(_event: React.SyntheticEvent, newValue: string | null) => {
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
          disabled={!selectedMedication}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleAddMedication}
          disabled={!selectedMedication || dose.trim() === ''}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddMedicationDialog
