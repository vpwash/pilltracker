import React, { useState } from 'react'
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material'
import { useAppContext } from '../contexts/useAppContext'
import { db } from '../db/db'

const MedicationLogList: React.FC = () => {
  const [editLogId, setEditLogId] = useState<number | null>(null);
  const [newTime, setNewTime] = useState<string>('');
  const { selectedMedicationId, getLogsForMedication, logMedicationTaken } =
    useAppContext()

  const medicationLogs = selectedMedicationId
    ? getLogsForMedication(selectedMedicationId)
    : undefined

  const handleEditLogTime = async () => {
    if (editLogId !== null) {
      const newTimestamp = new Date(newTime).getTime();
      await db.updateMedicationTime(editLogId, newTimestamp);
      setEditLogId(null);
    }
  };

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
        <>
          <List>
            {medicationLogs.map((log) => (
              <ListItem key={log.id}>
                <Button onClick={() => log.id !== undefined ? setEditLogId(log.id) : null}>Edit Time</Button>
                <ListItemText
                  primary={`Taken at: ${new Date(log.timestamp).toLocaleString()}`}
                />
              </ListItem>
            ))}
          </List>

          <Dialog open={editLogId !== null} onClose={() => setEditLogId(null)}>
            <DialogTitle>Edit Medication Time</DialogTitle>
            <DialogContent>
              <TextField
                label="New Time"
                type="datetime-local"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                fullWidth
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditLogId(null)}>Cancel</Button>
              <Button onClick={handleEditLogTime} color="primary">
                Save
              </Button>
            </DialogActions>
          </Dialog>
          <Button
            variant='contained'
            color='primary'
            onClick={handleLogTaken}
            sx={{ mt: 2 }}
          >
            Log Taken
          </Button>
        </>
      )}
    </Box>
  )
}

export default MedicationLogList
