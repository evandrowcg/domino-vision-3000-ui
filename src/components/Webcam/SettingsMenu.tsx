import React from 'react';
import { IconButton, Menu, MenuItem, Checkbox, Typography } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useWebcamContext } from './WebcamContext';

const SettingsMenu: React.FC = () => {
  const {
    menuAnchorEl,
    setMenuAnchorEl,
    livePredictions,
    setLivePredictions,
    drawDomino,
    setDrawDomino,
    showPredictionScore,
    setShowPredictionScore,
    lightOn,
    toggleLight,
  } = useWebcamContext();

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  return (
    <>
      <IconButton
        aria-label="Open settings menu"
        style={{ position: 'absolute', top: 8, right: 8, color: 'black', zIndex: 31 }}
        onClick={handleMenuOpen}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            setLivePredictions(!livePredictions);
          }}
        >
          <Checkbox checked={livePredictions} />
          <Typography variant="inherit" style={{ color: 'black' }}>
            Live predictions
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            setDrawDomino(!drawDomino);
          }}
        >
          <Checkbox checked={drawDomino} />
          <Typography variant="inherit" style={{ color: 'black' }}>
            Draw domino
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            setShowPredictionScore(!showPredictionScore);
          }}
        >
          <Checkbox checked={showPredictionScore} />
          <Typography variant="inherit" style={{ color: 'black' }}>
            Predictions score
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            toggleLight();
          }}
        >
          <Checkbox checked={lightOn} />
          <Typography variant="inherit" style={{ color: 'black' }}>
            Torch (Light)
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default SettingsMenu;
