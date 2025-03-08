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
import Box from '@mui/material/Box';
import { ModelConfig } from '../../ai/ModelConfig';
import { YoloModelTF, Prediction } from '../../ai/YoloModelTF';

interface Point {
  x: number;
  y: number;
}

interface WebcamProps {
  modelConfig: ModelConfig;
  // New callback prop to return detections to the parent.
  onDetections?: (detections: Prediction[]) => void;
}

const Webcam: React.FC<WebcamProps> = ({ modelConfig, onDetections }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const predictionIntervalRef = useRef<number | null>(null);

  // State for freeze/resume and checkbox settings.
  const [frozen, setFrozen] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [frozenPredictions, setFrozenPredictions] = useState<Prediction[]>([]);
  const [livePredictions, setLivePredictions] = useState(true);
  const [showPredictionScore, setShowPredictionScore] = useState(false);

  // Mode states.
  const [manualBoxMode, setManualBoxMode] = useState(false); // Add mode
  const [removeBoxMode, setRemoveBoxMode] = useState(false); // Remove mode
  const [editBoxMode, setEditBoxMode] = useState(false); // Edit mode
  const [editBoxIndex, setEditBoxIndex] = useState<number | null>(null);

  // State for temporary coordinates in add mode.
  const [manualBoxCoords, setManualBoxCoords] = useState<Point | null>(null);

  // State for showing the class selection overlay.
  const [showClassSelection, setShowClassSelection] = useState(false);

  // New state for loading status.
  const [loading, setLoading] = useState(true);

  // Memoize the model instance.
  const yoloModel = useMemo(
    () => new YoloModelTF(modelConfig.modelUrl, modelConfig.modelClasses),
    [modelConfig.modelUrl, modelConfig.modelClasses]
  );

  // Helper function to draw a detection label with background.
  // The background rectangle is drawn immediately above the box so that its bottom edge exactly
  // touches the top of the bounding box.
  const drawLabel = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, label: string) => {
      const fontSize = 18;
      const padding = 2;
      ctx.font = `${fontSize}px Arial`;
      ctx.textBaseline = "middle"; 
      const textWidth = ctx.measureText(label).width;
      const rectHeight = fontSize + 2 * padding;
      // Draw background rectangle immediately above the box.
      // Its bottom edge is exactly at y (the top of the box).
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(x - padding, y - rectHeight - 1, textWidth + padding * 2, rectHeight);
      // Draw text centered vertically within the rectangle.
      ctx.fillStyle = 'white';
      ctx.fillText(label, x, y - rectHeight / 2);
    },
    []
  );

  // Process predictions and draw boxes and labels.
  // All boxes are drawn first, then all labels are drawn.
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
      // Draw all bounding boxes first.
      detections.forEach((detection) => {
        const [x, y, width, height] = detection.bbox;
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
      });
      // Then, draw all labels on top.
      detections.forEach((detection) => {
        const [x, y] = detection.bbox;
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
    async function loadModel() {
      await yoloModel.loadModel();
      setLoading(false);
    }
    loadModel();
    startVideo();
    // Cleanup on unmount.
    const video = videoRef.current;
    return () => {
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

  // In frozen mode, draw boxes and then labels (boxes first, labels later).
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
          // Draw all boxes.
          frozenPredictions.forEach((detection) => {
            const [x, y, width, height] = detection.bbox;
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
          });
          // Then draw all labels on top.
          frozenPredictions.forEach((detection) => {
            const [x, y] = detection.bbox;
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

  // Call the parent's callback whenever detections change.
  useEffect(() => {
    if (onDetections) {
      onDetections(frozenPredictions);
    }
  }, [frozenPredictions, onDetections]);

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
      // removeBoxMode remains active.
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
      const defaultWidth = 50;
      const defaultHeight = 50;
      const newDetection: Prediction = {
        class: selectedClass,
        score: 1.0,
        bbox: [manualBoxCoords.x - defaultWidth / 2, manualBoxCoords.y - defaultHeight / 2, defaultWidth, defaultHeight],
      };
      setFrozenPredictions((prev) => [...prev, newDetection]);
      setShowClassSelection(false);
      setManualBoxCoords(null);
      // manualBoxMode remains active.
    } else if (editBoxMode && editBoxIndex !== null) {
      setFrozenPredictions((prev) => {
        const newPredictions = [...prev];
        newPredictions[editBoxIndex] = { ...newPredictions[editBoxIndex], class: selectedClass };
        return newPredictions;
      });
      setShowClassSelection(false);
      setEditBoxIndex(null);
      // editBoxMode remains active.
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
          {loading && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                fontSize: '24px',
                zIndex: 30,
              }}
            >
              Loading model...
            </div>
          )}
          {showClassSelection && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'white',
                p: 2,
                borderRadius: 1,
                zIndex: 10,
                width: { xs: '90vw', sm: '400px' },
              }}
            >
              <Typography variant="subtitle1">Select label:</Typography>
              <Stack direction="row" sx={{ flexWrap: 'wrap', mt: 1 }}>
                {modelConfig.modelClasses.map((cls, idx) => (
                  <Button
                    key={idx}
                    variant="outlined"
                    size="small"
                    onClick={() => handleClassSelection(cls)}
                    sx={{ flex: '1 0 calc(20% - 6px)', margin: '3px' }}
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
                  // Cancel all modes.
                  setManualBoxMode(false);
                  setRemoveBoxMode(false);
                  setEditBoxMode(false);
                }}
              >
                Cancel
              </Button>
            </Box>
          )}
        </div>
        <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
          <Button variant="contained" onClick={toggleFreeze}>
            {frozen ? "Resume" : "Freeze"}
          </Button>
          {frozen && (
            <>
              <Button
                variant="contained"
                color={manualBoxMode ? "success" : "primary"}
                onClick={() => {
                  // Toggle Add mode.
                  if (manualBoxMode) {
                    setManualBoxMode(false);
                  } else {
                    setManualBoxMode(true);
                    setRemoveBoxMode(false);
                    setEditBoxMode(false);
                  }
                }}
              >
                Add Box
              </Button>
              <Button
                variant="contained"
                color={removeBoxMode ? "error" : "primary"}
                onClick={() => {
                  // Toggle Remove mode.
                  if (removeBoxMode) {
                    setRemoveBoxMode(false);
                  } else {
                    setRemoveBoxMode(true);
                    setManualBoxMode(false);
                    setEditBoxMode(false);
                  }
                }}
              >
                Remove Box
              </Button>
              <Button
                variant="contained"
                color={editBoxMode ? "warning" : "primary"}
                onClick={() => {
                  // Toggle Edit mode.
                  if (editBoxMode) {
                    setEditBoxMode(false);
                  } else {
                    setEditBoxMode(true);
                    setManualBoxMode(false);
                    setRemoveBoxMode(false);
                  }
                }}
              >
                Edit Box
              </Button>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default Webcam;
