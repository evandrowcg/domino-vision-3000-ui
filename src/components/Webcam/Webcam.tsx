import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Checkbox,
  MenuItem,
  Menu,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import Box from '@mui/material/Box';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import { ModelConfig } from '../../ai/ModelConfig';
import { YoloModelTF, Prediction } from '../../ai/YoloModelTF';
import Domino from '../Domino/Domino';

interface Point {
  x: number;
  y: number;
}

interface WebcamProps {
  modelConfig: ModelConfig;
  onDetections?: (detections: Prediction[]) => void;
}

const Webcam: React.FC<WebcamProps> = ({ modelConfig, onDetections }) => {
  // ===== Refs & Theme =====
  const theme = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedImageRef = useRef<HTMLImageElement>(null);

  // ===== State Variables =====
  const [frozen, setFrozen] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [frozenPredictions, setFrozenPredictions] = useState<Prediction[]>([]);
  const [livePredictions, setLivePredictions] = useState(true);
  const [showPredictionScore, setShowPredictionScore] = useState(false);
  const [showSlowDialog, setShowSlowDialog] = useState(false);
  const [manualBoxMode, setManualBoxMode] = useState(false);
  const [removeBoxMode, setRemoveBoxMode] = useState(false);
  const [editBoxMode, setEditBoxMode] = useState(false);
  const [editBoxIndex, setEditBoxIndex] = useState<number | null>(null);
  const [manualBoxCoords, setManualBoxCoords] = useState<Point | null>(null);
  const [showClassSelection, setShowClassSelection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedStart, setSelectedStart] = useState(0);
  const [selectedEnd, setSelectedEnd] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [uploadedDimensions, setUploadedDimensions] = useState<{ width: number; height: number } | null>(null);
  // New state for smartphone light (torch)
  const [lightOn, setLightOn] = useState(false);
  // New state for showing the torch dialog when not available.
  const [showTorchDialog, setShowTorchDialog] = useState(false);

  // ===== Model Instance =====
  const yoloModel = useMemo(
    () => new YoloModelTF(modelConfig.modelUrl, modelConfig.modelClasses),
    [modelConfig.modelUrl, modelConfig.modelClasses]
  );

  // ===== Helper Functions =====

  const drawLabel = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, label: string) => {
      const fontSize = 18;
      const padding = 2;
      ctx.font = `${fontSize}px Arial`;
      ctx.textBaseline = 'middle';
      const textWidth = ctx.measureText(label).width;
      const rectHeight = fontSize + 2 * padding;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(x - padding, y - rectHeight - 1, textWidth + padding * 2, rectHeight);
      ctx.fillStyle = 'white';
      ctx.fillText(label, x, y - rectHeight / 2);
    },
    []
  );

  const processPredictions = useCallback(async (): Promise<Prediction[]> => {
    const video = videoRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!video || !overlayCanvas || video.videoWidth === 0 || video.videoHeight === 0) return [];
    
    const offscreenCanvas = offscreenCanvasRef.current;
    offscreenCanvas.width = video.videoWidth;
    offscreenCanvas.height = video.videoHeight;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (!offscreenCtx) return [];
    offscreenCtx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
  
    const startTime = performance.now();
    const detections = await yoloModel.predict(offscreenCanvas);
    const elapsedTime = performance.now() - startTime;
    if (elapsedTime > 2000 && livePredictions && !showSlowDialog) {
      setLivePredictions(false);
      setShowSlowDialog(true);
    }
    setLoading(false);
  
    const displayedWidth = video.clientWidth;
    const displayedHeight = video.clientHeight;
    overlayCanvas.width = displayedWidth;
    overlayCanvas.height = displayedHeight;
    overlayCanvas.style.width = displayedWidth + "px";
    overlayCanvas.style.height = displayedHeight + "px";
    const scaleX = displayedWidth / video.videoWidth;
    const scaleY = displayedHeight / video.videoHeight;
  
    const ctx = overlayCanvas.getContext('2d');
    if (ctx && !frozen && livePredictions) {
      ctx.clearRect(0, 0, displayedWidth, displayedHeight);
      detections.forEach((detection) => {
        const [x, y, width, height] = detection.bbox;
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * scaleX, y * scaleY, width * scaleX, height * scaleY);
      });
      detections.forEach((detection) => {
        const [x, y] = detection.bbox;
        const labelText = showPredictionScore
          ? `${detection.class} (${(detection.score * 100).toFixed(1)}%)`
          : detection.class;
        drawLabel(ctx, x * scaleX, y * scaleY, labelText);
      });
    }
    return detections;
  }, [yoloModel, frozen, livePredictions, showPredictionScore, drawLabel, showSlowDialog]);

  // ===== Toggle Smartphone Light =====
  const toggleLight = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      if ('torch' in capabilities && (capabilities as any).torch !== undefined) {
        track.applyConstraints({ advanced: [{ torch: !lightOn }] } as any)
          .then(() => setLightOn(!lightOn))
          .catch((error) => console.error("Error toggling torch:", error));
      } else {
        // Show dialog if torch is not supported.
        setShowTorchDialog(true);
        console.warn("Torch is not supported on this device.");
      }      
    }
  }, [lightOn]);

  // ===== Video & Model Initialization =====
  const startVideo = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      console.error('getUserMedia not supported');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Error accessing/playing video:', err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await yoloModel.loadModel();
      startVideo();
    })();
    const video = videoRef.current;
    return () => {
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
      }
    };
  }, [yoloModel, startVideo]);

  // ===== Prediction Interval =====
  useEffect(() => {
    let interval: number | null = null;
    if (!frozen && livePredictions) {
      interval = window.setInterval(processPredictions, 1000);
    } else if (!frozen && !livePredictions) {
      const overlayCanvas = overlayCanvasRef.current;
      if (overlayCanvas) {
        const ctx = overlayCanvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [livePredictions, frozen, processPredictions]);

  // ===== Drawing Frozen Predictions =====
  useEffect(() => {
    if (frozen && overlayCanvasRef.current) {
      const canvas = overlayCanvasRef.current;
      let drawWidth: number, drawHeight: number, scaleX = 1, scaleY = 1;
      if (uploadedDimensions && uploadedImageRef.current) {
        drawWidth = uploadedImageRef.current.clientWidth;
        drawHeight = uploadedImageRef.current.clientHeight;
        scaleX = uploadedDimensions.width / drawWidth;
        scaleY = uploadedDimensions.height / drawHeight;
      } else if (videoRef.current) {
        drawWidth = videoRef.current.clientWidth;
        drawHeight = videoRef.current.clientHeight;
        scaleX = videoRef.current.videoWidth / drawWidth;
        scaleY = videoRef.current.videoHeight / drawHeight;
      } else {
        return;
      }
      canvas.width = drawWidth;
      canvas.height = drawHeight;
      canvas.style.width = drawWidth + "px";
      canvas.style.height = drawHeight + "px";
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, drawWidth, drawHeight);
        frozenPredictions.forEach((detection) => {
          const [x, y, w, h] = detection.bbox;
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x / scaleX, y / scaleY, w / scaleX, h / scaleY);
        });
        frozenPredictions.forEach((detection) => {
          const [x, y] = detection.bbox;
          const labelText = showPredictionScore
            ? `${detection.class} (${(detection.score * 100).toFixed(1)}%)`
            : detection.class;
          drawLabel(ctx, x / scaleX, y / scaleY, labelText);
        });
      }
    }
  }, [frozen, frozenPredictions, showPredictionScore, drawLabel, uploadedDimensions]);

  useEffect(() => {
    if (onDetections) onDetections(frozenPredictions);
  }, [frozenPredictions, onDetections]);

  // ===== Event Handlers =====

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
      const detections = await processPredictions();
      setFrozenPredictions(detections.sort((a, b) => b.score - a.score));
      setFrozen(true);
    } else {
      try {
        await video.play();
      } catch (err: any) {
        console.error('Error resuming video:', err);
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
      setUploadedDimensions(null);
    }
  }, [frozen, processPredictions]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = async () => {
          if (videoRef.current) videoRef.current.pause();
          const maxSize = 640;
          let targetWidth = img.width;
          let targetHeight = img.height;
          if (img.width >= img.height) {
            if (img.width > maxSize) {
              targetWidth = maxSize;
              targetHeight = Math.round(img.height * (maxSize / img.width));
            }
          } else {
            if (img.height > maxSize) {
              targetHeight = maxSize;
              targetWidth = Math.round(img.width * (maxSize / img.height));
            }
          }
          const resizeCanvas = document.createElement('canvas');
          resizeCanvas.width = targetWidth;
          resizeCanvas.height = targetHeight;
          const resizeCtx = resizeCanvas.getContext('2d');
          if (resizeCtx) {
            resizeCtx.drawImage(img, 0, 0, targetWidth, targetHeight);
          }
          const resizedDataUrl = resizeCanvas.toDataURL();
          setSnapshot(resizedDataUrl);
          setUploadedDimensions({ width: targetWidth, height: targetHeight });
          setFrozen(true);
          const predictions = await yoloModel.predict(resizeCanvas);
          setFrozenPredictions(predictions.sort((a, b) => b.score - a.score));
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  }, [yoloModel]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!frozen) return;
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    let scaleX = 1, scaleY = 1;
    if (uploadedDimensions && uploadedImageRef.current) {
      const dispWidth = uploadedImageRef.current.clientWidth;
      const dispHeight = uploadedImageRef.current.clientHeight;
      scaleX = uploadedDimensions.width / dispWidth;
      scaleY = uploadedDimensions.height / dispHeight;
    } else if (videoRef.current) {
      scaleX = videoRef.current.videoWidth / videoRef.current.clientWidth;
      scaleY = videoRef.current.videoHeight / videoRef.current.clientHeight;
    }
    const x = clickX * scaleX;
    const y = clickY * scaleY;
    if (manualBoxMode) {
      setSelectedStart(0);
      setSelectedEnd(0);
      setManualBoxCoords({ x, y });
      setShowClassSelection(true);
    } else if (removeBoxMode) {
      setFrozenPredictions((prev) => {
        const indexToRemove = prev.findIndex((detection) => {
          const [dx, dy, dWidth, dHeight] = detection.bbox;
          return x >= dx && x <= dx + dWidth && y >= dy && y <= dy + dHeight;
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
        const [dx, dy, dWidth, dHeight] = detection.bbox;
        return x >= dx && x <= dx + dWidth && y >= dy && y <= dy + dHeight;
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
  }, [frozen, uploadedDimensions, manualBoxMode, removeBoxMode, editBoxMode, frozenPredictions]);

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

  // ===== Render =====
  return (
    <>
      <Card style={{ maxWidth: 800, margin: '20px auto', color: 'black' }}>
        <CardContent>
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
                ref={uploadedImageRef}
                src={snapshot}
                alt="Frozen frame"
                style={
                  uploadedDimensions
                    ? {
                        maxWidth: '100%',
                        maxHeight: '100%',
                        borderRadius: 4,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        pointerEvents: 'none',
                      }
                    : {
                        width: videoRef.current ? videoRef.current.clientWidth : '100%',
                        height: videoRef.current ? videoRef.current.clientHeight : '100%',
                        borderRadius: 4,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        pointerEvents: 'none',
                      }
                }
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
                backgroundColor: 'transparent',
              }}
            />
            {/* Three-Dot Menu */}
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
                  Predictions score
                </Typography>
              </MenuItem>
              {/* New Menu Item for Smartphone Light */}
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <FormControl sx={{ minWidth: 100 }}>
                    <InputLabel id="start-label" sx={{ color: 'black' }}>
                      Start
                    </InputLabel>
                    <Select
                      labelId="start-label"
                      value={selectedStart}
                      label="Start"
                      onChange={(e) => setSelectedStart(Number(e.target.value))}
                      sx={{ color: 'black', '.MuiSvgIcon-root': { color: 'black' } }}
                    >
                      {Array.from({ length: 13 }, (_, i) => (
                        <MenuItem key={i} value={i} sx={{ color: 'black' }}>
                          {i}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Domino left={selectedStart} right={selectedEnd} width="75px" />
                  <FormControl sx={{ minWidth: 100 }}>
                    <InputLabel id="end-label" sx={{ color: 'black' }}>
                      End
                    </InputLabel>
                    <Select
                      labelId="end-label"
                      value={selectedEnd}
                      label="End"
                      onChange={(e) => setSelectedEnd(Number(e.target.value))}
                      sx={{ color: 'black', '.MuiSvgIcon-root': { color: 'black' } }}
                    >
                      {Array.from({ length: 13 }, (_, i) => (
                        <MenuItem key={i} value={i} sx={{ color: 'black' }}>
                          {i}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
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
                  <Button variant="text" size="small" onClick={() => setShowClassSelection(false)}>
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}
          </div>
          {/* Camera Controls */}
          <Box sx={{ position: 'relative', width: '100%', mt: 2 }}>
            {!frozen ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Tooltip title="Capture Image">
                    <IconButton onClick={toggleFreeze} color="primary">
                      <CameraAltIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    right: 8,
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    gap: 1,
                  }}
                >
                  <Tooltip title="Upload Image">
                    <IconButton onClick={() => fileInputRef.current?.click()} color="primary">
                      <CloudUploadIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </>
            ) : (
              <>
                <Box sx={{ textAlign: 'center' }}>
                  <Tooltip title="Resume">
                    <IconButton onClick={toggleFreeze} color="primary">
                      <ArrowBackIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    right: 8,
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    gap: 1,
                  }}
                >
                  <Tooltip title="Add Box">
                    <IconButton
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
                      <AddCircleOutlineIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove Box">
                    <IconButton
                      color={removeBoxMode ? 'error' : 'primary'}
                      onClick={() => {
                        setRemoveBoxMode(!removeBoxMode);
                        setManualBoxMode(false);
                        setEditBoxMode(false);
                      }}
                    >
                      <RemoveCircleOutlineIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Box">
                    <IconButton
                      color={editBoxMode ? 'warning' : 'primary'}
                      onClick={() => {
                        setEditBoxMode(!editBoxMode);
                        setManualBoxMode(false);
                        setRemoveBoxMode(false);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
          </Box>
        </CardContent>
      </Card>
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
      {/* New Dialog for Torch Not Supported */}
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

export default Webcam;
