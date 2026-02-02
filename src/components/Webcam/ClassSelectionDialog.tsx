import React from 'react';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import Domino from '../Domino/Domino';
import { useWebcamContext } from './WebcamContext';

const ClassSelectionDialog: React.FC = () => {
  const {
    showClassSelection,
    setShowClassSelection,
    selectedStart,
    selectedEnd,
    setSelectedStart,
    setSelectedEnd,
    handleClassSelection,
  } = useWebcamContext();

  if (!showClassSelection) return null;

  const handleConfirm = () => {
    const minVal = Math.min(selectedStart, selectedEnd);
    const maxVal = Math.max(selectedStart, selectedEnd);
    const generatedClass = `${minVal}x${maxVal}`;
    handleClassSelection(generatedClass);
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        p: 2,
        borderRadius: 1,
        zIndex: 10,
        width: { xs: '90vw', sm: '400px' },
      }}
    >
      <Typography variant="subtitle1" style={{ color: 'black' }}>
        Domino:
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
        <FormControl sx={{ minWidth: 100 }}>
          <InputLabel id="start-label" sx={{ color: 'black' }}>
            Start
          </InputLabel>
          <Select
            labelId="start-label"
            value={selectedStart}
            label="Start"
            onChange={(e) => setSelectedStart(Number(e.target.value))}
            sx={{ color: 'black', '.MuiSvgIcon-root': { color: 'black' } }}
          >
            {Array.from({ length: 13 }, (_, i) => (
              <MenuItem key={i} value={i} sx={{ color: 'black' }}>
                {i}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Domino left={selectedStart} right={selectedEnd} width="75px" />
        <FormControl sx={{ minWidth: 100 }}>
          <InputLabel id="end-label" sx={{ color: 'black' }}>
            End
          </InputLabel>
          <Select
            labelId="end-label"
            value={selectedEnd}
            label="End"
            onChange={(e) => setSelectedEnd(Number(e.target.value))}
            sx={{ color: 'black', '.MuiSvgIcon-root': { color: 'black' } }}
          >
            {Array.from({ length: 13 }, (_, i) => (
              <MenuItem key={i} value={i} sx={{ color: 'black' }}>
                {i}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
        <Button variant="text" size="small" onClick={() => setShowClassSelection(false)}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleConfirm}>
          Confirm
        </Button>
      </Box>
    </Box>
  );
};

export default ClassSelectionDialog;
