import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { Card, CardContent, Typography, Button } from '@mui/material';
import { YoloModelTF, Prediction } from '../../ai/YoloModelTF';

const Webcam: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const predictionIntervalRef = useRef<number | null>(null);
  const [frozen, setFrozen] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [frozenPredictions, setFrozenPredictions] = useState<Prediction[]>([]);

  // Memoize the model instance so it isn't recreated on every render.
  const yoloModel = useMemo(() => new YoloModelTF('./models/tiles_yolo8s/model.json'), []);

  // Process predictions by capturing an offscreen frame, running inference, and drawing on the overlay.
  const processPredictions = useCallback(async (): Promise<Prediction[]> => {
    const video = videoRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!video || !overlayCanvas) return [];

    // Create an offscreen canvas to capture the current video frame.
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = video.videoWidth;
    offscreenCanvas.height = video.videoHeight;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (!offscreenCtx) return [];
    offscreenCtx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

    // Run YOLO inference using the offscreen canvas.
    const detections = await yoloModel.predict(offscreenCanvas);

    // Ensure the overlay canvas matches video dimensions.
    overlayCanvas.width = video.videoWidth;
    overlayCanvas.height = video.videoHeight;
    const ctx = overlayCanvas.getContext('2d');
    if (ctx) {
      // Clear and draw new detections.
      ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      detections.forEach((detection) => {
        const [x, y, width, height] = detection.bbox;
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = 'red';
        ctx.font = '18px Arial';
        ctx.fillText(
          `${detection.class} (${(detection.score * 100).toFixed(1)}%)`,
          x,
          y > 20 ? y - 5 : y + 20
        );
      });
    }
    return detections;
  }, [yoloModel]);

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

  // On mount: load model, start video, and start continuous predictions.
  useEffect(() => {
    yoloModel.loadModel();
    startVideo();
    predictionIntervalRef.current = window.setInterval(processPredictions, 500);
    return () => {
      if (predictionIntervalRef.current) clearInterval(predictionIntervalRef.current);
      const video = videoRef.current;
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [yoloModel, startVideo, processPredictions]);

  // When frozen and predictions are available, redraw them to the overlay canvas.
  useEffect(() => {
    if (frozen && frozenPredictions.length > 0 && overlayCanvasRef.current && videoRef.current) {
      const canvas = overlayCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const video = videoRef.current;
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        frozenPredictions.forEach((detection) => {
          const [x, y, width, height] = detection.bbox;
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);
          ctx.fillStyle = 'red';
          ctx.font = '18px Arial';
          ctx.fillText(
            `${detection.class} (${(detection.score * 100).toFixed(1)}%)`,
            x,
            y > 20 ? y - 5 : y + 20
          );
        });
      }
    }
  }, [frozen, frozenPredictions]);

  // Toggle freeze/resume: if freezing, capture snapshot, pause video, clear interval, and run one prediction.
  // When resuming, play video and restart predictions.
  const toggleFreeze = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    if (!frozen) {
      // Freeze: capture snapshot.
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        setSnapshot(tempCanvas.toDataURL());
      }
      // Pause video and stop predictions.
      video.pause();
      if (predictionIntervalRef.current) {
        clearInterval(predictionIntervalRef.current);
        predictionIntervalRef.current = null;
      }
      // Run one prediction and update frozen predictions.
      const detections = await processPredictions();
      const sortedDetections = detections.sort((a, b) => b.score - a.score);
      setFrozenPredictions(sortedDetections);
      setFrozen(true);
    } else {
      // Resume: play video and restart predictions.
      video.play().catch((err: any) => console.error("Error resuming video:", err));
      predictionIntervalRef.current = window.setInterval(processPredictions, 500);
      setFrozen(false);
      setSnapshot(null);
      setFrozenPredictions([]);
    }
  }, [frozen, processPredictions]);

  return (
    <Card style={{ maxWidth: 800, margin: '20px auto' }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          YOLO Inference with Rear Camera
        </Typography>
        <div style={{ position: 'relative', width: '100%' }}>
          {/* Always render the video element; its opacity is controlled by frozen state */}
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
          {/* When frozen, render the snapshot on top */}
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
          {/* Overlay canvas for predictions */}
          <canvas
            ref={overlayCanvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              borderRadius: 4,
              width: '100%',
              height: '100%',
            }}
          />
        </div>
        {/* Freeze/Resume button placed below the video */}
        <Button variant="contained" onClick={toggleFreeze} style={{ marginTop: 10 }}>
          {frozen ? "Resume" : "Freeze"}
        </Button>
        {/* When frozen, display sorted predictions (only class name and score in black) */}
        {frozen && frozenPredictions.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <Typography variant="h6" style={{ color: 'black' }}>
              Detections:
            </Typography>
            <ul>
              {frozenPredictions.map((pred, idx) => (
                <li key={idx} style={{ color: 'black' }}>
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
