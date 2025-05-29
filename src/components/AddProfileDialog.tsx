import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material'
import { useAppContext } from '../contexts/useAppContext'

interface AddProfileDialogProps {
  open: boolean
  onClose: () => void
}

const AddProfileDialog: React.FC<AddProfileDialogProps> = ({
  open,
  onClose,
}) => {
  const { addProfile } = useAppContext()
  const [profileName, setProfileName] = useState('')

  const handleAddProfile = async () => {
    if (profileName.trim() !== '') {
      await addProfile(profileName.trim())
      setProfileName('')
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
    >
      <DialogTitle>Add New Profile</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin='dense'
          label='Profile Name'
          type='text'
          fullWidth
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleAddProfile}>Add</Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddProfileDialog
