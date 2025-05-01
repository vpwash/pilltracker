import React from 'react'
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Button,
} from '@mui/material'
import { useAppContext } from '../contexts/AppContext'

const MedicationLogList: React.FC = () => {
  const { selectedMedicationId, getLogsForMedication, logMedicationTaken } =
    useAppContext()

  const medicationLogs = selectedMedicationId
    ? getLogsForMedication(selectedMedicationId)
    : undefined

  const handleLogTaken = () => {
    if (selectedMedicationId !== null) {
      logMedicationTaken(selectedMedicationId)
    }
  }

  if (selectedMedicationId === null) {
    return null // Don't render if no medication is selected
  }

  if (!medicationLogs) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant='h6'>Loading logs...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant='h5'
        gutterBottom
      >
        Medication Logs
      </Typography>
      {medicationLogs.length === 0 ? (
        <Typography>No logs yet.</Typography>
      ) : (
        <List>
          {medicationLogs.map((log) => (
            <ListItem key={log.id}>
              <ListItemText
                primary={`Taken at: ${new Date(
                  log.timestamp
                ).toLocaleString()}`}
              />
            </ListItem>
          ))}
        </List>
      )}
      <Button
        variant='contained'
        color='primary'
        onClick={handleLogTaken}
        sx={{ mt: 2 }}
      >
        Log Taken
      </Button>
    </Box>
  )
}

export default MedicationLogList
