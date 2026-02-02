import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { useWebcamContext } from './WebcamContext';

const LoadingOverlay: React.FC = () => {
  const {
    loading,
    cameraError,
    startVideo,
    fileInputRef,
  } = useWebcamContext();

  if (loading) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 30,
          gap: 2,
        }}
      >
        <CircularProgress color="primary" size={48} />
        <Typography variant="body1" sx={{ color: 'white' }}>
          Loading AI model...
        </Typography>
        <Typography variant="caption" sx={{ color: 'grey.500' }}>
          This may take a moment
        </Typography>
      </Box>
    );
  }

  if (cameraError) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 29,
          p: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Camera Unavailable
        </Typography>
        <Typography variant="body2" sx={{ color: 'grey.400', mb: 3, maxWidth: 300 }}>
          {cameraError}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={startVideo}>
            Try Again
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Image
          </Button>
        </Box>
      </Box>
    );
  }

  return null;
};

export default LoadingOverlay;
