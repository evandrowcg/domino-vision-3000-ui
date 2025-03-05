import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  FormControlLabel,
  Checkbox,
  Stack,
} from '@mui/material';
import { YoloModelTF, Prediction } from '../../ai/YoloModelTF';

const CLASS_NAMES = [
  "3x6", "3x10", "2x5", "11x11", "0x8", "4x10", "1x6", "5x9", "0x3", "4x8",
  "2x12", "11x12", "9x9", "2x11", "6x11", "3x12", "5x5", "3x11", "4x6", "5x8",
  "2x2", "3x3", "5x11", "9x12", "7x11", "1x11", "9x11", "4x12", "4x4", "5x10",
  "0x4", "7x9", "2x9", "7x12", "2x4", "5x7", "5x12", "7x7", "10x12", "8x8",
  "1x1", "2x3", "3x9", "8x9", "12x12", "0x6", "7x8", "8x11", "6x7", "2x8",
  "3x4", "0x11", "1x7", "0x2", "3x5", "1x10", "6x8", "1x8", "0x1", "1x3",
  "6x6", "2x10", "0x10", "6x12", "1x2", "0x9", "4x9", "1x4", "0x12", "2x7",
  "10x10", "0x7", "4x7", "10x11", "8x12", "6x9", "2x6", "3x7", "3x8", "1x12",
  "4x11", "1x5", "7x10", "5x6", "9x10", "8x10", "4x5", "0x5", "0x0", "6x10",
  "1x9"
];

interface Point {
  x: number;
  y: number;
}

const Webcam: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const predictionIntervalRef = useRef<number | null>(null);

  // State for freeze/resume and checkbox settings.
  const [frozen, setFrozen] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [frozenPredictions, setFrozenPredictions] = useState<Prediction[]>([]);
  const [livePredictions, setLivePredictions] = useState(true);
  const [showPredictionScore, setShowPredictionScore] = useState(false);

  // State for manual box drawing when frozen.
  const [manualBoxMode, setManualBoxMode] = useState(false);
  const [manualBoxCoords, setManualBoxCoords] = useState<Point | null>(null);

  // State for removal mode.
  const [removeBoxMode, setRemoveBoxMode] = useState(false);

  // State for edit mode.
  const [editBoxMode, setEditBoxMode] = useState(false);
  const [editBoxIndex, setEditBoxIndex] = useState<number | null>(null);

  // State for showing the class selection overlay.
  const [showClassSelection, setShowClassSelection] = useState(false);

  // Memoize the model instance.
  const yoloModel = useMemo(() => new YoloModelTF('./models/tiles_yolo8s/model.json', CLASS_NAMES), []);

  // Helper function to draw a detection label.
  const drawLabel = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, label: string) => {
      ctx.font = '18px Arial';
      ctx.fillStyle = 'red';
      ctx.fillText(label, x, y > 20 ? y - 5 : y + 20);
    },
    []
  );

  // Process predictions.
  const processPredictions = useCallback(async (): Promise<Prediction[]> => {
    const video = videoRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!video || !overlayCanvas) return [];
    if (video.videoWidth === 0 || video.videoHeight === 0) return [];
    
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = video.videoWidth;
    offscreenCanvas.height = video.videoHeight;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (!offscreenCtx) return [];
    offscreenCtx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

    const detections = await yoloModel.predict(offscreenCanvas);

    overlayCanvas.width = video.videoWidth;
    overlayCanvas.height = video.videoHeight;
    const ctx = overlayCanvas.getContext('2d');
    if (ctx && !frozen && livePredictions) {
      ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      detections.forEach((detection) => {
        const [x, y, width, height] = detection.bbox;
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        const labelText = showPredictionScore
          ? `${detection.class} (${(detection.score * 100).toFixed(1)}%)`
          : detection.class;
        drawLabel(ctx, x, y, labelText);
      });
    }
    return detections;
  }, [yoloModel, showPredictionScore, frozen, livePredictions, drawLabel]);

  const startVideo = useCallback(async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (err: any) {
            if (err.name === 'AbortError') {
              console.warn("Video play aborted:", err);
            } else {
              console.error("Error playing video:", err);
            }
          }
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
      }
    } else {
      console.error('getUserMedia not supported in this browser');
    }
  }, []);

  useEffect(() => {
    yoloModel.loadModel();
    startVideo();
    return () => {
      const video = videoRef.current;
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [yoloModel, startVideo]);

  useEffect(() => {
    if (predictionIntervalRef.current) {
      clearInterval(predictionIntervalRef.current);
      predictionIntervalRef.current = null;
    }
    if (!frozen && livePredictions) {
      predictionIntervalRef.current = window.setInterval(processPredictions, 500);
    } else if (!frozen && !livePredictions) {
      const overlayCanvas = overlayCanvasRef.current;
      if (overlayCanvas) {
        const ctx = overlayCanvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      }
    }
    return () => {
      if (predictionIntervalRef.current) clearInterval(predictionIntervalRef.current);
    };
  }, [livePredictions, frozen, processPredictions]);

  useEffect(() => {
    if (frozen && overlayCanvasRef.current && videoRef.current) {
      const canvas = overlayCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const video = videoRef.current;
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (frozenPredictions.length > 0) {
          frozenPredictions.forEach((detection) => {
            const [x, y, width, height] = detection.bbox;
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
            const labelText = showPredictionScore
              ? `${detection.class} (${(detection.score * 100).toFixed(1)}%)`
              : detection.class;
            drawLabel(ctx, x, y, labelText);
          });
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
  }, [frozen, frozenPredictions, showPredictionScore, drawLabel]);

  const toggleFreeze = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    if (!frozen) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        setSnapshot(tempCanvas.toDataURL());
      }
      video.pause();
      if (predictionIntervalRef.current) {
        clearInterval(predictionIntervalRef.current);
        predictionIntervalRef.current = null;
      }
      const detections = await processPredictions();
      const sortedDetections = detections.sort((a, b) => b.score - a.score);
      setFrozenPredictions(sortedDetections);
      setFrozen(true);
    } else {
      video.play().catch((err: any) => console.error("Error resuming video:", err));
      if (livePredictions) {
        predictionIntervalRef.current = window.setInterval(processPredictions, 500);
      }
      setFrozen(false);
      setSnapshot(null);
      setFrozenPredictions([]);
      setManualBoxMode(false);
      setManualBoxCoords(null);
      setShowClassSelection(false);
      setRemoveBoxMode(false);
      setEditBoxMode(false);
      setEditBoxIndex(null);
    }
  }, [frozen, processPredictions, livePredictions]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!frozen) return;
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    if (manualBoxMode) {
      setManualBoxCoords({ x: clickX, y: clickY });
      setShowClassSelection(true);
    } else if (removeBoxMode) {
      setFrozenPredictions((prev) => {
        const indexToRemove = prev.findIndex((detection) => {
          const [x, y, width, height] = detection.bbox;
          return clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height;
        });
        if (indexToRemove >= 0) {
          const newPredictions = [...prev];
          newPredictions.splice(indexToRemove, 1);
          return newPredictions;
        }
        return prev;
      });
      setRemoveBoxMode(false);
    } else if (editBoxMode) {
      const indexToEdit = frozenPredictions.findIndex((detection) => {
        const [x, y, width, height] = detection.bbox;
        return clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height;
      });
      if (indexToEdit >= 0) {
        setEditBoxIndex(indexToEdit);
        setShowClassSelection(true);
      }
    }
  }, [frozen, manualBoxMode, removeBoxMode, editBoxMode, frozenPredictions]);

  const handleClassSelection = useCallback((selectedClass: string) => {
    if (manualBoxMode && manualBoxCoords) {
      const defaultWidth = 100;
      const defaultHeight = 100;
      const newDetection: Prediction = {
        class: selectedClass,
        score: 1.0,
        bbox: [manualBoxCoords.x, manualBoxCoords.y, defaultWidth, defaultHeight],
      };
      setFrozenPredictions((prev) => [...prev, newDetection]);
      setShowClassSelection(false);
      setManualBoxMode(false);
      setManualBoxCoords(null);
    } else if (editBoxMode && editBoxIndex !== null) {
      setFrozenPredictions((prev) => {
        const newPredictions = [...prev];
        newPredictions[editBoxIndex] = { ...newPredictions[editBoxIndex], class: selectedClass };
        return newPredictions;
      });
      setShowClassSelection(false);
      setEditBoxMode(false);
      setEditBoxIndex(null);
    }
  }, [manualBoxMode, manualBoxCoords, editBoxMode, editBoxIndex]);

  return (
    <Card style={{ maxWidth: 800, margin: '20px auto', color: 'black' }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          YOLO Inference with Rear Camera
        </Typography>
        <div style={{ marginBottom: 10 }}>
          <FormControlLabel
            control={<Checkbox checked={livePredictions} onChange={(e) => setLivePredictions(e.target.checked)} />}
            label="Live predictions"
          />
          <FormControlLabel
            control={<Checkbox checked={showPredictionScore} onChange={(e) => setShowPredictionScore(e.target.checked)} />}
            label="Show prediction score"
          />
        </div>
        <div style={{ position: 'relative', width: '100%' }}>
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              width: '100%',
              borderRadius: 4,
              display: 'block',
              opacity: frozen ? 0 : 1,
            }}
          />
          {frozen && snapshot && (
            <img
              src={snapshot}
              alt="Frozen frame"
              style={{
                width: '100%',
                borderRadius: 4,
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
              }}
            />
          )}
          <canvas
            ref={overlayCanvasRef}
            onClick={handleCanvasClick}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: (manualBoxMode || removeBoxMode || editBoxMode) ? 'auto' : 'none',
              borderRadius: 4,
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent',
            }}
          />
          {showClassSelection && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'white',
                padding: '10px',
                borderRadius: '4px',
                zIndex: 10,
              }}
            >
              <Typography variant="subtitle1">Select label:</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', marginTop: 1 }}>
                {CLASS_NAMES.map((cls, idx) => (
                  <Button
                    key={idx}
                    variant="outlined"
                    size="small"
                    onClick={() => handleClassSelection(cls)}
                  >
                    {cls}
                  </Button>
                ))}
              </Stack>
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setShowClassSelection(false);
                  setManualBoxMode(false);
                  setEditBoxMode(false);
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
        <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
          <Button variant="contained" onClick={toggleFreeze}>
            {frozen ? "Resume" : "Freeze"}
          </Button>
          {frozen && (
            <>
              <Button variant="contained" onClick={() => setManualBoxMode(true)}>
                Add Box
              </Button>
              <Button variant="contained" onClick={() => setRemoveBoxMode(true)}>
                Remove Box
              </Button>
              <Button variant="contained" onClick={() => setEditBoxMode(true)}>
                Edit Box
              </Button>
            </>
          )}
        </Stack>
        {frozen && frozenPredictions.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <Typography variant="h6">Detections:</Typography>
            <ul>
              {frozenPredictions.map((pred, idx) => (
                <li key={idx}>
                  {pred.class}: {(pred.score * 100).toFixed(1)}%
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Webcam;
