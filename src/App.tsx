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
  Tabs,
  Tab,
} from '@mui/material'
import ProfileList from './components/ProfileList' // Import ProfileList
import AddProfileDialog from './components/AddProfileDialog' // Import AddProfileDialog
import MedicationList from './components/MedicationList' // Import MedicationList
import AddMedicationDialog from './components/AddMedicationDialog' // Import AddMedicationDialog
// MedicationLogList import removed
import EditMedicationDialog from './components/EditMedicationDialog' // Import EditMedicationDialog

// Basic theme (can be customized later)
const theme = createTheme({
  palette: {
    mode: 'light', // or 'dark'
  },
})

import { useAppContext } from './contexts/useAppContext'
import MedicationHistory from './components/MedicationHistory' // Import MedicationHistory

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

function App() {
  const [addProfileDialogOpen, setAddProfileDialogOpen] = React.useState(false)
  const [addMedicationDialogOpen, setAddMedicationDialogOpen] =
    React.useState(false)
  const [editMedicationDialogOpen, setEditMedicationDialogOpen] =
    React.useState(false)
  const [currentTab, setCurrentTab] = React.useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

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
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={handleTabChange} aria-label="basic tabs example">
              <Tab label="Current Medications" {...a11yProps(0)} />
              <Tab label="Medication History" {...a11yProps(1)} />
            </Tabs>
          </Box>
        <TabPanel value={currentTab} index={0}>
          <Container
            component='main'
            sx={{ flexGrow: 1 }}
          >
            {/* Main content area - Components will go here */}
            {/* Welcome message removed as it's now part of the tab content */}
            <ProfileList /> {/* Add ProfileList component */}
            <MedicationList
              onAddMedicationClick={() => setAddMedicationDialogOpen(true)}
              onEditMedicationClick={() => setEditMedicationDialogOpen(true)} // Pass function to open edit dialog
            />{' '}
            {/* Add MedicationList component and pass prop */}
            {/* MedicationLogList component removed */}
          </Container>
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <Container
            component='main'
            sx={{ flexGrow: 1 }}
          >
            <MedicationHistory />
          </Container>
        </TabPanel>
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
