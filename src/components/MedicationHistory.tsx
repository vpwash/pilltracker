import React from 'react';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ChartOptions,
  ChartDataset,
  TooltipModel,
  TooltipItem
} from 'chart.js';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import { useAppContext } from '../contexts/useAppContext';
import { HistoricalMedicationLog } from '../contexts/types';

type DateData = {
  count: number;
  doses: string[];
};

interface ChartDataPoint {
  x: string;
  y: number;
  doses: string[];
}

interface CustomChartDataset extends Omit<ChartDataset<'bar', (number | null)[]>, 'data'> {
  label: string;
  data: (number | null)[];
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  _custom: {
    originalData: ChartDataPoint[];
  };
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MedicationHistory: React.FC = () => {
  const { 
    historicalLogs, 
    selectedProfileId, 
    profiles, 
    selectProfile 
  } = useAppContext();



  const handleProfileChange = (event: SelectChangeEvent<number | string>) => {
    if (event.target.value === '') return;
    const newProfileId = event.target.value as number;
    selectProfile(newProfileId);
  };

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

  if (!historicalLogs || historicalLogs.length === 0) {

    return (
      <Box sx={{ mt: 2, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            Medication History
          </Typography>
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel id="profile-selector-label">Profile</InputLabel>
            <Select
              labelId="profile-selector-label"
              value={selectedProfileId}
              onChange={handleProfileChange}
              label="Profile"
            >
              {profiles?.map((profile) => (
                <MenuItem key={profile.id} value={profile.id}>
                  {profile.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Typography>
          No medication history found for the selected profile.
          <br />
          <br />
          Try taking some medications first by clicking the 'Take' button on the Current Medications tab.
        </Typography>
      </Box>
    );
  }

  // Prepare data for the bar chart
  // Group data by medication name and date
  const medications = Array.from(new Set(historicalLogs.map((log: HistoricalMedicationLog) => log.medicationName)));
  
  // Group logs by date for each medication and track doses
  const groupedData = new Map<string, Map<string, DateData>>();
  
  // Get all unique dates from the logs
  const allDates = new Set<string>();
  
  historicalLogs.forEach((log: HistoricalMedicationLog) => {
    const date = new Date(log.timestamp).toLocaleDateString();
    allDates.add(date);
    
    if (!groupedData.has(log.medicationName)) {
      groupedData.set(log.medicationName, new Map<string, {count: number, doses: string[]}>());
    }
    
    const medData = groupedData.get(log.medicationName)!;
    if (!medData.has(date)) {
      medData.set(date, { count: 0, doses: [] });
    }
    
    const dateData = medData.get(date)!;
    dateData.count += 1;
    // For historical logs, we don't have dose information, so we'll use an empty string
    dateData.doses.push('');
  });
  
  // Sort dates chronologically
  const sortedDates = Array.from(allDates).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });
  
  // Create datasets for each medication with proper typing
  const datasets = medications.map((medName, index) => {
    const medData = groupedData.get(medName) || new Map<string, DateData>();
    
    const dataPoints = sortedDates.map((date: string): ChartDataPoint => {
      const data = medData.get(date);
      return {
        x: date,
        y: data?.count || 0,
        doses: data?.doses || []
      };
    });
    
    // Create the dataset with both the original data and Chart.js compatible data
    const dataset: CustomChartDataset = {
      label: medName,
      data: dataPoints.map(dp => dp.y), // Use just the y values for Chart.js
      _custom: {
        originalData: dataPoints // Store the full data points for tooltips
      },
      backgroundColor: `hsl(${(index * 360) / medications.length}, 70%, 50%)`,
      borderColor: `hsl(${(index * 360) / medications.length}, 70%, 40%)`,
      borderWidth: 1,
      // Add any required ChartDataset properties with default values
      borderSkipped: false,
      borderRadius: 4,
      barPercentage: 0.8,
      categoryPercentage: 0.9
    };
    
    return dataset;
  });
  
  // Explicitly type the data to match CustomChartDataset
  const data: {
    labels: string[];
    datasets: CustomChartDataset[];
  } = {
    labels: sortedDates,
    datasets: datasets,
  };

  const options: ChartOptions<'bar'> = {
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    parsing: {
      xAxisKey: 'x',
      yAxisKey: 'y'
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          font: {
            weight: 'bold' as const,
          },
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Number of Times Taken',
          font: {
            weight: 'bold' as const,
          },
        },
        beginAtZero: true,
        ticks: {
          precision: 0,
          stepSize: 1,
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: 'Medication Intake by Date',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'rect',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        padding: 12,
        callbacks: {
          label: function(this: TooltipModel<'bar'>, tooltipItem: TooltipItem<'bar'>) {
            const dataset = this.dataPoints?.[0]?.dataset as CustomChartDataset | undefined;
            const customData = dataset?._custom?.originalData;
            const dataPoint = customData?.[tooltipItem.dataIndex];
            
            if (!dataPoint || !dataPoint.doses?.length) return [];
            
            const label = dataset?.label || '';
            const value = dataPoint.y;
            const doses = dataPoint.doses;
            
            if (doses.length === 0) return [];
            
            // Since we don't have dose information in historical logs,
            // we'll just show the count
            return [`${label}: ${value} time${value !== 1 ? 's' : ''}`];
          },
        },
      },
    },
  };

  return (
    <Box sx={{ mt: 2, p: 2, height: 'calc(100vh - 200px)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Medication Intake Timeline
        </Typography>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="profile-selector-label">Profile</InputLabel>
          <Select
            labelId="profile-selector-label"
            value={selectedProfileId}
            onChange={handleProfileChange}
            label="Profile"
          >
            {profiles?.map((profile) => (
              <MenuItem key={profile.id} value={profile.id}>
                {profile.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ height: 'calc(100% - 60px)', minHeight: '400px' }}>
        {datasets.length > 0 ? (
          <Bar data={data} options={options} />
        ) : (
          <Typography>
            No medication logs to display for the selected profile.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default MedicationHistory;
