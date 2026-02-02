import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  useTheme,
} from '@mui/material';
import { useWebcamContext } from './WebcamContext';

const WarningDialogs: React.FC = () => {
  const theme = useTheme();
  const {
    showSlowDialog,
    setShowSlowDialog,
    showTorchDialog,
    setShowTorchDialog,
  } = useWebcamContext();

  return (
    <>
      <Dialog open={showSlowDialog} onClose={() => setShowSlowDialog(false)}>
        <DialogTitle sx={{ color: theme.palette.text.secondary }}>Warning</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Live predictions are taking too long on your device and have been disabled to improve performance.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSlowDialog(false)}>Ok</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showTorchDialog} onClose={() => setShowTorchDialog(false)}>
        <DialogTitle sx={{ color: theme.palette.text.secondary }}>Warning</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The torch (light) is not supported on this device.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTorchDialog(false)}>Ok</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WarningDialogs;
