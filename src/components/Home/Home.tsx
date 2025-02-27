import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
} from "@mui/material";

const Home = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const handleOpen = () => setOpen(true);

  const handleClose = () => setOpen(false);

  const handleProceed = () => {
    setOpen(false);
    navigate("/solve");
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      flexDirection="column"
      alignItems="center"
      minHeight="100vh"
    >
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 4 }}>
        Welcome!
      </Typography>
      <Button
        variant="contained"
        color="primary"
        sx={{ mb: 3 }}
        onClick={() => navigate("/count")}
      >
        Count
      </Button>
      <Button variant="contained" color="primary" onClick={handleOpen}>
        Solve
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle sx={{ color: theme.palette.text.secondary }}>
          Warning
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Proceeding may spoil the fun of the game. Are you sure you want to
            continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleProceed} color="primary" autoFocus>
            Proceed
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Home;
