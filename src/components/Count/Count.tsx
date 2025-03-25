import { FC, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import Webcam from "../Webcam/Webcam";
import { DOMINO_YOLOV8s } from "../../ai/ModelConfig";
import { Prediction } from "../../ai/YoloModelTF";
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

interface CountProps {}

const Count: FC<CountProps> = () => {
  const [totalSum, setTotalSum] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const prevTotalRef = useRef<number>(0);

  const [helpOpen, setHelpOpen] = useState(false);
  const handleOpenHelp = () => setHelpOpen(true);
  const handleCloseHelp = () => setHelpOpen(false);

  const handleDetections = useCallback((newDetections: Prediction[]) => {
    const newTotal: number = newDetections.reduce((acc, det) => {
      const parts = det.class.split("x");
      const detectionSum = parts.reduce(
        (sum, part) => sum + parseInt(part, 10),
        0
      );
      return acc + detectionSum;
    }, 0);

    if (newTotal !== prevTotalRef.current) {
      prevTotalRef.current = newTotal;
      setTotalSum(newTotal);
    }
    setTotalCount(newDetections.length);
  }, []);

  return (
    <Box sx={{ p: 1 }}>
      <Box
        sx={{
          maxWidth: 800,
          mx: "auto",
          mt: 1,
          mb: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton component={Link} to="/" sx={{ p: 0 }}>
            <ArrowBackIcon sx={{ color: "white" }} />
          </IconButton>
          <Typography variant="h5" component="h1" sx={{ ml: 1 }}>
            Count
          </Typography>
        </Box>

        <IconButton onClick={handleOpenHelp}>
          <HelpOutlineIcon sx={{ color: "white" }} />
        </IconButton>
      </Box>

      <Webcam modelConfig={DOMINO_YOLOV8s} onDetections={handleDetections} />

      <Card sx={{ maxWidth: 800, mx: "auto", mt: 1, color: "black" }}>
        <CardContent>
          <Typography variant="h6">
            Detected pieces count: {totalCount}
          </Typography>
          <Typography variant="h6">Total sum: {totalSum}</Typography>
        </CardContent>
      </Card>

      {/* Help Dialog */}
      <Dialog open={helpOpen} onClose={handleCloseHelp}>
        <DialogTitle sx={{ color: "black" }}>Instructions</DialogTitle>
        <DialogContent sx={{ color: "black" }}>
          <Typography>
            1. Capture or upload the dominoes image
          </Typography>
          <Typography>
            2. Check if all pieces were detected correctly
          </Typography>
          <Typography>
            3. Add / remove / edit boxes if needed
          </Typography>
          <Typography>
            4. Check the total number of detected pieces and the sum of all pips
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHelp} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Count;
