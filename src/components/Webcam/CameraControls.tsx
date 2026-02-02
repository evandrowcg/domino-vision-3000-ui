import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import { useWebcamContext } from './WebcamContext';

const CameraControls: React.FC = () => {
  const {
    frozen,
    manualBoxMode,
    removeBoxMode,
    editBoxMode,
    fileInputRef,
    toggleFreeze,
    toggleAddMode,
    toggleRemoveMode,
    toggleEditMode,
    handleImageUpload,
  } = useWebcamContext();

  return (
    <Box sx={{ position: 'relative', width: '100%', mt: 2 }}>
      {!frozen ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Tooltip title="Capture Image">
              <IconButton aria-label="Capture image" onClick={toggleFreeze} color="primary">
                <CameraAltIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              right: 8,
              transform: 'translateY(-50%)',
              display: 'flex',
              gap: 1,
            }}
          >
            <Tooltip title="Upload Image">
              <IconButton
                aria-label="Upload image"
                onClick={() => fileInputRef.current?.click()}
                color="primary"
              >
                <CloudUploadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </>
      ) : (
        <>
          <Box sx={{ textAlign: 'center' }}>
            <Tooltip title="Resume">
              <IconButton aria-label="Resume video" onClick={toggleFreeze} color="primary">
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              right: 8,
              transform: 'translateY(-50%)',
              display: 'flex',
              gap: 1,
            }}
          >
            <Tooltip title="Add Box (A)">
              <IconButton
                aria-label="Add detection box"
                aria-pressed={manualBoxMode}
                color={manualBoxMode ? 'success' : 'primary'}
                onClick={toggleAddMode}
              >
                <AddCircleOutlineIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove Box (R)">
              <IconButton
                aria-label="Remove detection box"
                aria-pressed={removeBoxMode}
                color={removeBoxMode ? 'error' : 'primary'}
                onClick={toggleRemoveMode}
              >
                <RemoveCircleOutlineIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Box (E)">
              <IconButton
                aria-label="Edit detection box"
                aria-pressed={editBoxMode}
                color={editBoxMode ? 'warning' : 'primary'}
                onClick={toggleEditMode}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </>
      )}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
    </Box>
  );
};

export default CameraControls;
