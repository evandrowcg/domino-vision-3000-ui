import { FC, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import Webcam from "../Webcam/Webcam";
import { DOMINO_YOLOV8s } from "../../ai/ModelConfig";
import { Prediction } from "../../ai/YoloModelTF";
import { Box, Typography, Card, CardContent, IconButton } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface CountProps {}

const Count: FC<CountProps> = () => {
  const [totalSum, setTotalSum] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const prevTotalRef = useRef<number>(0);

  const handleDetections = useCallback((newDetections: Prediction[]) => {
    const newTotal: number = newDetections.reduce((acc, det) => {
      const parts = det.class.split("x");
      const detectionSum = parts.reduce((sum, part) => sum + parseInt(part, 10), 0);
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
          mb: 0, // Removed bottom margin for tighter spacing
          display: "flex",
          alignItems: "center",
        }}
      >
        <IconButton component={Link} to="/" sx={{ p: 0 }}>
          <ArrowBackIcon sx={{ color: "white" }} />
        </IconButton>
        <Typography variant="h5" component="h1" sx={{ ml: 1 }}>
          Count
        </Typography>
      </Box>
      <Webcam modelConfig={DOMINO_YOLOV8s} onDetections={handleDetections} />
      <Card sx={{ maxWidth: 800, mx: "auto", mt: 1, color: "black" }}>
        <CardContent>
        <Typography variant="h6">
            Detected pieces count: {totalCount}
          </Typography>
          <Typography variant="h6">
            Total sum: {totalSum}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Count;
