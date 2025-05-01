import React from 'react'
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
} from '@mui/material'
import ProfileList from './components/ProfileList' // Import ProfileList
import AddProfileDialog from './components/AddProfileDialog' // Import AddProfileDialog
import MedicationList from './components/MedicationList' // Import MedicationList
import AddMedicationDialog from './components/AddMedicationDialog' // Import AddMedicationDialog
import MedicationLogList from './components/MedicationLogList' // Import MedicationLogList
import EditMedicationDialog from './components/EditMedicationDialog' // Import EditMedicationDialog

// Basic theme (can be customized later)
const theme = createTheme({
  palette: {
    mode: 'light', // or 'dark'
  },
})

import { useAppContext } from './contexts/AppContext'

function App() {
  const [addProfileDialogOpen, setAddProfileDialogOpen] = React.useState(false)
  const [addMedicationDialogOpen, setAddMedicationDialogOpen] =
    React.useState(false)
  const [editMedicationDialogOpen, setEditMedicationDialogOpen] =
    React.useState(false)

  const {
    selectedProfileId,
    selectedMedicationId,
    selectedProfileMedications,
  } = useAppContext()

  // Find the selected medication object
  const selectedMedication = React.useMemo(() => {
    return selectedProfileMedications?.find(
      (med) => med.id === selectedMedicationId
    )
  }, [selectedMedicationId, selectedProfileMedications])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Normalize styles */}
      <Box
        sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <AppBar position='static'>
          <Toolbar>
            <Typography
              variant='h6'
              component='div'
              sx={{ flexGrow: 1 }}
            >
              Pill Tracker
            </Typography>
            <Button
              color='inherit'
              onClick={() => setAddProfileDialogOpen(true)}
            >
              Add Profile
            </Button>
          </Toolbar>
        </AppBar>
        <Container
          component='main'
          sx={{ mt: 4, mb: 4, flexGrow: 1 }}
        >
          {/* Main content area - Components will go here */}
          <Typography
            variant='h4'
            component='h1'
            gutterBottom
          >
            Welcome to Pill Tracker
          </Typography>
          <Typography>Manage profiles and track medications easily.</Typography>
          <ProfileList /> {/* Add ProfileList component */}
          <MedicationList
            onAddMedicationClick={() => setAddMedicationDialogOpen(true)}
            onEditMedicationClick={() => setEditMedicationDialogOpen(true)} // Pass function to open edit dialog
          />{' '}
          {/* Add MedicationList component and pass prop */}
          {selectedMedicationId && <MedicationLogList />}{' '}
          {/* Conditionally render MedicationLogList */}
        </Container>
        <Box
          component='footer'
          sx={{
            py: 2,
            px: 2,
            mt: 'auto',
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[200]
                : theme.palette.grey[800],
          }}
        >
          <Container maxWidth='sm'>
            <Typography
              variant='body2'
              color='text.secondary'
              align='center'
            >
              {'© '}
              Pill Tracker {new Date().getFullYear()}
              {'.'}
            </Typography>
          </Container>
        </Box>
      </Box>
      <AddProfileDialog
        open={addProfileDialogOpen}
        onClose={() => setAddProfileDialogOpen(false)}
      />
      <AddMedicationDialog
        open={addMedicationDialogOpen}
        onClose={() => setAddMedicationDialogOpen(false)}
        profileId={selectedProfileId}
      />
      <EditMedicationDialog
        open={editMedicationDialogOpen}
        onClose={() => setEditMedicationDialogOpen(false)}
        medication={selectedMedication || null}
      />
    </ThemeProvider>
  )
}

export default App
