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
  Link,
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
      <Box
        component="img"
        sx={{
          width: 350,
          maxWidth: { xs: 250, md: 300 },
        }}
        alt="Descriptive alt text"
        src="./images/dominoes.png"
      />
      <Typography variant="h6" fontWeight="bold" sx={{ mt:1, mb: 1 }}>
        Welcome to
      </Typography>
      {/* Container for title with beta */}
      <Box sx={{ position: "relative", display: "inline-block", mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          Domino Vision 3000!
        </Typography>
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            right: 0,
            top: "100%",
            mt: 0,
            color: "gray",
          }}
        >
          beta
        </Typography>
      </Box>
      <Button
        variant="contained"
        color="primary"
        sx={{ mb: 3 }}
        onClick={() => navigate("/count")}
      >
        Count
      </Button>
      <Button variant="contained" color="primary" sx={{ mb: 3 }} onClick={handleOpen}>
        Solve
      </Button>
      <Typography
  variant="caption"
  sx={{ color: "gray", maxWidth: 300, textAlign: "center" }}
>
  This app was trained with double-twelve domino set and works best using a smartphone.
</Typography>
<Typography
  variant="caption"
  sx={{ mt: 2, color: "gray", maxWidth: 300, textAlign: "center" }}>
<Link href="https://github.com/evandrowcg/domino-vision-3000-ui" underline="hover" target="_blank">
        Github
      </Link>
</Typography>

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
