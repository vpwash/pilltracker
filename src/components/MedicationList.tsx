import React, { useState } from 'react'
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Box,
  ListItemButton,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import { useAppContext } from '../contexts/useAppContext'
import { Button } from '@mui/material'
import LogMedicationDialog from './LogMedicationDialog' // Import the new dialog component

interface MedicationListProps {
  onAddMedicationClick: () => void
  onEditMedicationClick: () => void // Add onEditMedicationClick prop
}

const MedicationList: React.FC<MedicationListProps> = ({
  onAddMedicationClick,
  onEditMedicationClick, // Destructure onEditMedicationClick
}) => {
  const {
    selectedProfileMedications,
    deleteMedication,
    selectedProfileId,
    selectMedication, // Get selectMedication from context
    selectedMedicationId, // Get selectedMedicationId from context
    medicationLogs, // Get medicationLogs from context
    logMedicationTaken, // Get logMedicationTaken from context
  } = useAppContext()

  // Helper function to format time difference
  const formatTimeDifference = (timestamp: number): string => {
    const now = Date.now()
    const diffInMilliseconds = now - timestamp
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60))
    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24))

    if (diffInMinutes < 1) {
      return 'just now'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    }
  }

  const handleDeleteClick = (medicationId: number) => {
    deleteMedication(medicationId)
  }

  const handleEditClick = (medicationId: number) => {
    selectMedication(medicationId) // Select the medication to be edited
    onEditMedicationClick() // Call the prop function to open the edit dialog
  }

  const [logDialogOpen, setLogDialogOpen] = useState(false)
  const [selectedMedicationForLog, setSelectedMedicationForLog] = useState<{id: number, name: string} | null>(null)

  const handleLogClick = (medicationId: number, medicationName: string) => {
    setSelectedMedicationForLog({ id: medicationId, name: medicationName })
    setLogDialogOpen(true)
  }

  const handleLogConfirm = (timestamp: number) => {
    if (selectedMedicationForLog) {
      logMedicationTaken(selectedMedicationForLog.id, timestamp)
    }
    setLogDialogOpen(false)
    setSelectedMedicationForLog(null)
  }

  const handleMedicationClick = (medicationId: number) => {
    selectMedication(medicationId) // Select the clicked medication
  }

  if (selectedProfileId === null) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant='h6'>
          Select a profile to view medications.
        </Typography>
      </Box>
    )
  }

  if (!selectedProfileMedications) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant='h6'>Loading medications...</Typography>
      </Box>
    )
  }

  if (selectedProfileMedications.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant='h6'>No medications added yet.</Typography>
        <Button
          variant='contained'
          color='primary'
          onClick={onAddMedicationClick}
          sx={{ mt: 2 }}
        >
          Add Medication
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant='h5'
        gutterBottom
      >
        Medications
      </Typography>
      {/* Removed invalid console.log from JSX */}
      <List>
        {selectedProfileMedications.map((medication) => {
          // Removed debugging console.log
          return (
            <ListItem
              key={medication.id}
              disablePadding // Recommended when using ListItemButton
              secondaryAction={
                <Box>
                  <IconButton
                    edge='end'
                    aria-label='log'
                    onClick={() => handleLogClick(medication.id!, medication.name)}
                    sx={{ mr: 1 }}
                  >
                    <AddIcon />
                  </IconButton>
                  <IconButton
                    edge='end'
                    aria-label='edit'
                    onClick={() => handleEditClick(medication.id!)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge='end'
                    aria-label='delete'
                    onClick={(event) => {
                      event.stopPropagation() // Prevent ListItemButton click
                      handleDeleteClick(medication.id!)
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemButton
                selected={selectedMedicationId === medication.id} // Highlight selected item
                onClick={() => handleMedicationClick(medication.id!)} // Select medication on click
              >
                <ListItemText
                  primary={medication.name}
                  secondary={
                    <>
                      {`Dose: ${medication.dose}`}
                      {medicationLogs &&
                        medication.id &&
                        medicationLogs.has(medication.id) && (
                          <>
                            <br />
                            Last taken:{' '}
                            {formatTimeDifference(
                              medicationLogs.get(medication.id)!.slice(-1)[0]
                                .timestamp
                            )}
                          </>
                        )}
                    </>
                  }
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
      <Button
        variant='contained'
        color='primary'
        onClick={onAddMedicationClick}
        sx={{ mt: 2 }}
      >
        Add Medication
      </Button>
      
      {selectedMedicationForLog && (
        <LogMedicationDialog
          open={logDialogOpen}
          onClose={() => setLogDialogOpen(false)}
          onLog={handleLogConfirm}
          medicationName={selectedMedicationForLog.name}
        />
      )}
    </Box>
  )
}

export default MedicationList
