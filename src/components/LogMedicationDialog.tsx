import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface LogMedicationDialogProps {
  open: boolean;
  onClose: () => void;
  onLog: (timestamp: number) => void;
  medicationName: string;
}

const LogMedicationDialog: React.FC<LogMedicationDialogProps> = ({
  open,
  onClose,
  onLog,
  medicationName,
}) => {
  const [timestamp, setTimestamp] = useState<Date>(new Date());

  useEffect(() => {
    if (open) {
      // Reset to current time whenever dialog is opened
      setTimestamp(new Date());
    }
  }, [open]);

  const handleLog = () => {
    onLog(timestamp.getTime());
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Log {medicationName} Taken</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Date & Time"
              value={timestamp}
              onChange={(newValue) => {
                if (newValue) {
                  setTimestamp(newValue);
                }
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'normal'
                }
              }}
            />
          </LocalizationProvider>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleLog} variant="contained" color="primary">
          Log
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogMedicationDialog;
