import React from 'react'
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  // ListItemIcon, // Removed unused import
  ListItemButton,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAppContext } from '../contexts/AppContext'
// Removed unused Profile import

// interface ProfileListProps {} // Removed empty interface

const ProfileList: React.FC = () => {
  // Removed ProfileListProps type
  const { profiles, selectProfile, deleteProfile, selectedProfileId } =
    useAppContext()

  const handleProfileClick = (profileId: number | undefined) => {
    if (profileId !== undefined) {
      selectProfile(profileId)
    }
  }

  const handleDeleteClick = (
    event: React.MouseEvent,
    profileId: number | undefined
  ) => {
    event.stopPropagation() // Prevent ListItemButton click
    if (profileId !== undefined) {
      deleteProfile(profileId)
    }
  }

  if (!profiles) {
    return (
      <List>
        <ListItem>
          <ListItemText primary='Loading profiles...' />
        </ListItem>
      </List>
    )
  }

  if (profiles.length === 0) {
    return (
      <List>
        <ListItem>
          <ListItemText primary='No profiles yet. Add one!' />
        </ListItem>
      </List>
    )
  }

  return (
    <List>
      {profiles.map((profile) => (
        <ListItem
          key={profile.id}
          disablePadding // Recommended when using ListItemButton
          secondaryAction={
            // Place IconButton in secondaryAction
            <IconButton
              edge='end'
              aria-label='delete'
              onClick={(event) => handleDeleteClick(event, profile.id)}
            >
              <DeleteIcon />
            </IconButton>
          }
        >
          <ListItemButton
            selected={selectedProfileId === profile.id} // Highlight selected item
            onClick={() => handleProfileClick(profile.id)}
          >
            {/* Removed ListItemIcon wrapper for IconButton */}
            <ListItemText primary={profile.name} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  )
}

export default ProfileList
