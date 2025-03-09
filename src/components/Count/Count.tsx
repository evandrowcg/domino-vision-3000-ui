import { FC, useState, useCallback, useRef } from "react";
import Webcam from "../Webcam/Webcam";
import { DOMINO_YOLOV8s } from "../../ai/ModelConfig";
import { Prediction } from "../../ai/YoloModelTF";
import { Box, Typography, Card, CardContent } from "@mui/material";

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
    <Box sx={{ p: 2 }}>
      <Webcam modelConfig={DOMINO_YOLOV8s} onDetections={handleDetections} />
      <Card sx={{ maxWidth: 800, margin: '20px auto', color: 'black' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Total Sum: {totalSum}
          </Typography>
          <Typography variant="h6">
            Total Pieces: {totalCount}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Count;
