import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Checkbox,
  MenuItem,
  Menu,
  IconButton,
} from '@mui/material';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { ModelConfig } from '../../ai/ModelConfig';
import { YoloModelTF, Prediction } from '../../ai/YoloModelTF';

interface Point {
  x: number;
  y: number;
}

interface WebcamProps {
  modelConfig: ModelConfig;
  // Callback prop to return detections to the parent.
  onDetections?: (detections: Prediction[]) => void;
}

const Webcam: React.FC<WebcamProps> = ({ modelConfig, onDetections }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const predictionIntervalRef = useRef<number | null>(null);

  // State variables.
  const [frozen, setFrozen] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [frozenPredictions, setFrozenPredictions] = useState<Prediction[]>([]);
  const [livePredictions, setLivePredictions] = useState(true);
  const [showPredictionScore, setShowPredictionScore] = useState(false);

  const [manualBoxMode, setManualBoxMode] = useState(false);
  const [removeBoxMode, setRemoveBoxMode] = useState(false);
  const [editBoxMode, setEditBoxMode] = useState(false);
  const [editBoxIndex, setEditBoxIndex] = useState<number | null>(null);

  const [manualBoxCoords, setManualBoxCoords] = useState<Point | null>(null);
  const [showClassSelection, setShowClassSelection] = useState(false);
  const [loading, setLoading] = useState(true);

  // New states for dropdown values.
  const [selectedStart, setSelectedStart] = useState(0);
  const [selectedEnd, setSelectedEnd] = useState(0);

  // New state for the 3-dot menu anchor.
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  // Memoize the model instance.
  const yoloModel = useMemo(
    () => new YoloModelTF(modelConfig.modelUrl, modelConfig.modelClasses),
    [modelConfig.modelUrl, modelConfig.modelClasses]
  );

  // Helper function to draw a label with background.
  const drawLabel = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, label: string) => {
      const fontSize = 18;
      const padding = 2;
      ctx.font = `${fontSize}px Arial`;
      ctx.textBaseline = 'middle';
      const textWidth = ctx.measureText(label).width;
      const rectHeight = fontSize + 2 * padding;
      // Draw a semi-transparent background rectangle immediately above the bounding box.
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(x - padding, y - rectHeight - 1, textWidth + padding * 2, rectHeight);
      ctx.fillStyle = 'white';
      ctx.fillText(label, x, y - rectHeight / 2);
    },
    []
  );

  // Process predictions: capture frame, run model, and draw bounding boxes/labels.
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
      // Draw all bounding boxes.
      detections.forEach((detection) => {
        const [x, y, width, height] = detection.bbox;
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
      });
      // Then, draw labels.
      detections.forEach((detection) => {
        const [x, y] = detection.bbox;
        const labelText = showPredictionScore
          ? `${detection.class} (${(detection.score * 100).toFixed(1)}%)`
          : detection.class;
        drawLabel(ctx, x, y, labelText);
      });
    }
    return detections;
  }, [yoloModel, frozen, livePredictions, showPredictionScore, drawLabel]);

  // Start the webcam video.
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
              console.warn('Video play aborted:', err);
            } else {
              console.error('Error playing video:', err);
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

  // Load the model and start video on mount.
  useEffect(() => {
    async function loadModel() {
      await yoloModel.loadModel();
      setLoading(false);
    }
    loadModel();
    startVideo();
    // Cleanup video stream on unmount.
    const video = videoRef.current;
    return () => {
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [yoloModel, startVideo]);

  // Set interval for predictions.
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

  // In frozen mode, draw predictions on the overlay canvas.
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
          });
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

  // Pass detections to the parent component.
  useEffect(() => {
    if (onDetections) {
      onDetections(frozenPredictions);
    }
  }, [frozenPredictions, onDetections]);

  // Toggle freeze/resume.
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
      video.play().catch((err: any) => console.error('Error resuming video:', err));
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

  // Handle clicks on the canvas.
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
      setSelectedStart(0);
      setSelectedEnd(0);
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
    } else if (editBoxMode) {
      const indexToEdit = frozenPredictions.findIndex((detection) => {
        const [x, y, width, height] = detection.bbox;
        return clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height;
      });
      if (indexToEdit >= 0) {
        const detection = frozenPredictions[indexToEdit];
        if (detection.class && detection.class.includes('x')) {
          const parts = detection.class.split('x');
          if (parts.length === 2) {
            setSelectedStart(Number(parts[0]));
            setSelectedEnd(Number(parts[1]));
          }
        } else {
          setSelectedStart(0);
          setSelectedEnd(0);
        }
        setEditBoxIndex(indexToEdit);
        setShowClassSelection(true);
      }
    }
  }, [frozen, manualBoxMode, removeBoxMode, editBoxMode, frozenPredictions]);

  // Handle class selection (adding or editing a detection).
  const handleClassSelection = useCallback((selectedClass: string) => {
    if (manualBoxMode && manualBoxCoords) {
      const defaultWidth = 50;
      const defaultHeight = 50;
      const newDetection: Prediction = {
        class: selectedClass,
        score: 1.0,
        bbox: [
          manualBoxCoords.x - defaultWidth / 2,
          manualBoxCoords.y - defaultHeight / 2,
          defaultWidth,
          defaultHeight,
        ],
      };
      setFrozenPredictions((prev) => [...prev, newDetection]);
      setShowClassSelection(false);
      setManualBoxCoords(null);
    } else if (editBoxMode && editBoxIndex !== null) {
      setFrozenPredictions((prev) => {
        const newPredictions = [...prev];
        newPredictions[editBoxIndex] = { ...newPredictions[editBoxIndex], class: selectedClass };
        return newPredictions;
      });
      setShowClassSelection(false);
      setEditBoxIndex(null);
    }
  }, [manualBoxMode, manualBoxCoords, editBoxMode, editBoxIndex]);

  return (
    <Card style={{ maxWidth: 800, margin: '20px auto', color: 'black' }}>
      <CardContent>
        {/* Video container */}
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
          {/* Three-dot menu button (text/icon color set to black) */}
          <IconButton
            style={{ position: 'absolute', top: 8, right: 8, color: 'black', zIndex: 31 }}
            onClick={(event) => setMenuAnchorEl(event.currentTarget)}
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={() => setMenuAnchorEl(null)}
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
                setShowPredictionScore(!showPredictionScore);
              }}
            >
              <Checkbox checked={showPredictionScore} />
              <Typography variant="inherit" style={{ color: 'black' }}>
                Show prediction score
              </Typography>
            </MenuItem>
          </Menu>
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
              <Typography variant="subtitle1" style={{ color: 'black' }}>
                Domino:
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 1 }}>
                <FormControl sx={{ minWidth: 100 }}>
                  <InputLabel id="start-label" sx={{ color: 'black' }}>
                    Start
                  </InputLabel>
                  <Select
                    labelId="start-label"
                    value={selectedStart}
                    label="Start"
                    onChange={(e) => setSelectedStart(Number(e.target.value))}
                    sx={{
                      color: 'black',
                      '.MuiSvgIcon-root': { color: 'black' },
                    }}
                  >
                    {Array.from({ length: 13 }, (_, i) => (
                      <MenuItem key={i} value={i} sx={{ color: 'black' }}>
                        {i}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 100 }}>
                  <InputLabel id="end-label" sx={{ color: 'black' }}>
                    End
                  </InputLabel>
                  <Select
                    labelId="end-label"
                    value={selectedEnd}
                    label="End"
                    onChange={(e) => setSelectedEnd(Number(e.target.value))}
                    sx={{
                      color: 'black',
                      '.MuiSvgIcon-root': { color: 'black' },
                    }}
                  >
                    {Array.from({ length: 13 }, (_, i) => (
                      <MenuItem key={i} value={i} sx={{ color: 'black' }}>
                        {i}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => {
                    const minVal = Math.min(selectedStart, selectedEnd);
                    const maxVal = Math.max(selectedStart, selectedEnd);
                    const generatedClass = `${minVal}x${maxVal}`;
                    handleClassSelection(generatedClass);
                  }}
                >
                  Confirm
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setShowClassSelection(false);
                  }}
                >
                  Cancel
                </Button>
              </Stack>
            </Box>
          )}
        </div>
        <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
          <Button variant="contained" onClick={toggleFreeze}>
            {frozen ? 'Resume' : 'Freeze'}
          </Button>
          {frozen && (
            <>
              <Button
                variant="contained"
                color={manualBoxMode ? 'success' : 'primary'}
                onClick={() => {
                  if (!manualBoxMode) {
                    setSelectedStart(0);
                    setSelectedEnd(0);
                  }
                  setManualBoxMode(!manualBoxMode);
                  setRemoveBoxMode(false);
                  setEditBoxMode(false);
                }}
              >
                Add Box
              </Button>
              <Button
                variant="contained"
                color={removeBoxMode ? 'error' : 'primary'}
                onClick={() => {
                  setRemoveBoxMode(!removeBoxMode);
                  setManualBoxMode(false);
                  setEditBoxMode(false);
                }}
              >
                Remove Box
              </Button>
              <Button
                variant="contained"
                color={editBoxMode ? 'warning' : 'primary'}
                onClick={() => {
                  setEditBoxMode(!editBoxMode);
                  setManualBoxMode(false);
                  setRemoveBoxMode(false);
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
