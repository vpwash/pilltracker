import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useAppContext } from '../contexts/useAppContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

// Dialog component for adding/editing log entries
const LogEntryDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSave: (timestamp: Date) => Promise<void>;
  initialDate?: Date;
  title: string;
  saveButtonText: string;
}> = ({ open, onClose, onSave, initialDate = new Date(), title, saveButtonText }) => {
  const [timestamp, setTimestamp] = useState<Date>(initialDate);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(timestamp);
      onClose();
    } catch (error) {
      console.error('Error saving log entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateTimePicker
            label="Date & Time"
            value={timestamp}
            onChange={(newValue) => newValue && setTimestamp(newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                margin: 'normal',
                sx: { mt: 2 }
              }
            }}
          />
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained" disabled={isSaving}>
          {isSaving ? 'Saving...' : saveButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Confirmation dialog for delete
const ConfirmationDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmButtonText?: string;
}> = ({ open, onClose, onConfirm, title, message, confirmButtonText = 'Delete' }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error during deletion:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          color="error" 
          variant="contained" 
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const MedicationHistoryList: React.FC = () => {
  const { 
    historicalLogs, 
    selectedProfileId, 
    profiles, 
    selectProfile,
    selectedProfileMedications,
    logMedicationTaken,
    updateMedicationLog,
    deleteMedicationLog,
  } = useAppContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State for dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<{
    id?: number;
    medicationId: number;
    medicationName: string;
    timestamp: number;
  } | null>(null);

  const handleProfileChange = (event: SelectChangeEvent<number | string>) => {
    if (event.target.value === '') return;
    selectProfile(Number(event.target.value));
  };

  // Fetch all medications for the selected profile to get dose information
  const medications = useLiveQuery(
    async () => {
      if (!selectedProfileId) return [];
      return db.medications
        .where('profileId')
        .equals(selectedProfileId)
        .toArray();
    },
    [selectedProfileId]
  );
  
  // Handle editing a log entry
  const handleEditLog = (log: { id: number; medicationId: number; medicationName: string; timestamp: number }) => {
    setSelectedLog(log);
    setEditDialogOpen(true);
  };
  
  // Handle saving an edited log entry
  const handleSaveEdit = async (timestamp: Date) => {
    if (!selectedLog?.id) return;
    await updateMedicationLog(selectedLog.id, { timestamp: timestamp.getTime() });
    setEditDialogOpen(false);
    setSelectedLog(null);
  };
  
  // Handle adding a new log entry
  const handleAddLog = (medicationId: number, medicationName: string) => {
    setSelectedLog({
      medicationId,
      medicationName,
      timestamp: Date.now()
    });
    setAddDialogOpen(true);
  };
  
  // Handle saving a new log entry
  const handleSaveNewLog = async (timestamp: Date) => {
    if (!selectedLog?.medicationId) return;
    await logMedicationTaken(selectedLog.medicationId, timestamp.getTime());
    setAddDialogOpen(false);
    setSelectedLog(null);
  };
  
  // Handle deleting a log entry
  const handleDeleteClick = (log: { id: number; medicationId: number; medicationName: string }) => {
    setSelectedLog({
      id: log.id,
      medicationId: log.medicationId,
      medicationName: log.medicationName,
      timestamp: 0 // Not used for delete
    });
    setDeleteDialogOpen(true);
  };
  
  // Handle confirming delete
  const handleConfirmDelete = async () => {
    if (!selectedLog?.id) return;
    await deleteMedicationLog(selectedLog.id);
    setDeleteDialogOpen(false);
    setSelectedLog(null);
  };

  // Create a map of medication IDs to their details
  const medicationMap = React.useMemo(() => {
    const map = new Map<number, { name: string; dose: string }>();
    medications?.forEach(med => {
      if (med.id) {
        map.set(med.id, {
          name: med.name,
          dose: med.dose || ''
        });
      }
    });
    return map;
  }, [medications]);

  // Group logs by medication
  const groupedLogs = React.useMemo(() => {
    if (!historicalLogs || historicalLogs.length === 0) return [];

    const groups: Record<string, {
      medicationId: number;
      medicationName: string;
      dose: string;
      logs: Array<{
        id: number;
        date: string;
        time: string;
        timestamp: number;
      }>;
    }> = {};

    historicalLogs.forEach(log => {
      const medication = medicationMap.get(log.medicationId);
      if (!medication) return;

      const date = new Date(log.timestamp);
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (!groups[medication.name]) {
        groups[medication.name] = {
          medicationId: log.medicationId,
          medicationName: medication.name,
          dose: medication.dose,
          logs: []
        };
      }

      // Skip logs with undefined id
      if (log.id === undefined) {
        console.warn('Skipping log entry with undefined id:', log);
        return;
      }

      groups[medication.name].logs.push({
        id: log.id,
        date: dateStr,
        time: timeStr,
        timestamp: log.timestamp
      });
    });

    // Sort each medication's logs by timestamp (newest first)
    Object.values(groups).forEach(group => {
      group.logs.sort((a, b) => b.timestamp - a.timestamp);
    });

    // Convert to array and sort by medication name
    return Object.values(groups).sort((a, b) => 
      a.medicationName.localeCompare(b.medicationName)
    );
  }, [historicalLogs, medicationMap]);

  if (!selectedProfileId) {
    return (
      <Box sx={{ mt: 2, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Select a profile to view medication history
        </Typography>
        {profiles && profiles.length > 0 ? (
          <FormControl fullWidth sx={{ mt: 2, maxWidth: 400 }}>
            <InputLabel id="profile-select-label">Select Profile</InputLabel>
            <Select
              labelId="profile-select-label"
              value={profiles?.[0]?.id || ''}
              onChange={handleProfileChange}
              label="Select Profile"
            >
              {profiles.map((profile) => (
                <MenuItem key={profile.id} value={profile.id}>
                  {profile.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Typography>No profiles available. Please create a profile first.</Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2, p: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 3,
        gap: 2
      }}>
        <Typography variant="h5" component="h2">
          Medication History
        </Typography>
        <FormControl sx={{ minWidth: 200, width: { xs: '100%', sm: 'auto' } }} size="small">
          <InputLabel id="profile-selector-label">Profile</InputLabel>
          <Select
            labelId="profile-selector-label"
            value={selectedProfileId || ''}
            onChange={handleProfileChange}
            label="Profile"
            fullWidth={isMobile}
          >
            {profiles?.map((profile) => (
              <MenuItem key={profile.id} value={profile.id}>
                {profile.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {groupedLogs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="textSecondary">
            No medication history found. Log a medication to see it here.
          </Typography>
        </Box>
      ) : (
        groupedLogs.map(({ medicationId, medicationName, dose, logs }) => (
          <Box key={`${medicationId}-${medicationName}`} sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">
                {medicationName}
                {dose && (
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ({dose})
                  </Typography>
                )}
              </Typography>
              {isMobile ? (
                <IconButton
                  color="primary"
                  onClick={() => {
                    const med = selectedProfileMedications?.find(m => m.id === medicationId);
                    if (med) {
                      handleAddLog(med.id!, med.name);
                    }
                  }}
                  sx={{ ml: 1 }}
                >
                  <AddIcon />
                </IconButton>
              ) : (
                <Button 
                  variant="contained" 
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const med = selectedProfileMedications?.find(m => m.id === medicationId);
                    if (med) {
                      handleAddLog(med.id!, med.name);
                    }
                  }}
                  sx={{ ml: 2 }}
                >
                  Add Log
                </Button>
              )}
            </Box>
            <TableContainer component={Paper} sx={{ mb: 3, boxShadow: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                    <TableCell sx={{ width: 100, fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log, index) => (
                    <TableRow 
                      key={`${medicationId}-${log.id}-${index}`}
                      sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
                    >
                      <TableCell>{log.date}</TableCell>
                      <TableCell>{log.time}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditLog({
                                id: log.id,
                                medicationId,
                                medicationName,
                                timestamp: log.timestamp
                              })}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteClick({
                                id: log.id,
                                medicationId,
                                medicationName
                              })}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))
      )}
      
      {/* Dialogs */}
      {selectedLog?.id && (
        <LogEntryDialog
          key="edit-dialog"
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedLog(null);
          }}
          onSave={handleSaveEdit}
          initialDate={new Date(selectedLog.timestamp)}
          title={`Edit ${selectedLog.medicationName} Entry`}
          saveButtonText="Save Changes"
        />
      )}
      
      {selectedLog?.medicationId && (
        <>
          <LogEntryDialog
            key="add-dialog"
            open={addDialogOpen}
            onClose={() => {
              setAddDialogOpen(false);
              setSelectedLog(null);
            }}
            onSave={handleSaveNewLog}
            title={`Log ${selectedLog.medicationName} Taken`}
            saveButtonText="Log Medication"
          />
          
          <ConfirmationDialog
            key="delete-dialog"
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setSelectedLog(null);
            }}
            onConfirm={handleConfirmDelete}
            title="Delete Log Entry"
            message={`Are you sure you want to delete this ${selectedLog.medicationName} entry?`}
          />
        </>
      )}
    </Box>
  );
};

export default MedicationHistoryList;
