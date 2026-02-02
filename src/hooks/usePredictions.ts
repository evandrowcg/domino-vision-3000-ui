import { useState, useCallback, useEffect, RefObject } from 'react';
import { Prediction } from '../ai/YoloModelTF';
import { useLocalStorage } from './useLocalStorage';

interface UsePredictionsOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  overlayCanvasRef: RefObject<HTMLCanvasElement | null>;
  offscreenCanvasRef: RefObject<HTMLCanvasElement>;
  uploadedImageRef: RefObject<HTMLImageElement | null>;
  uploadedDimensions: { width: number; height: number } | null;
  yoloModel: { predict: (canvas: HTMLCanvasElement) => Promise<Prediction[]> };
  drawLabel: (ctx: CanvasRenderingContext2D, x: number, y: number, label: string) => void;
  onLoadingChange: (loading: boolean) => void;
  onDetections?: (detections: Prediction[]) => void;
}

interface UsePredictionsReturn {
  frozen: boolean;
  snapshot: string | null;
  frozenPredictions: Prediction[];
  livePredictions: boolean;
  showPredictionScore: boolean;
  showSlowDialog: boolean;
  drawDomino: boolean;
  setFrozen: (frozen: boolean) => void;
  setSnapshot: (snapshot: string | null) => void;
  setFrozenPredictions: React.Dispatch<React.SetStateAction<Prediction[]>>;
  setLivePredictions: (live: boolean) => void;
  setShowPredictionScore: (show: boolean) => void;
  setShowSlowDialog: (show: boolean) => void;
  setDrawDomino: (draw: boolean) => void;
  processPredictions: () => Promise<Prediction[]>;
  toggleFreeze: () => Promise<void>;
}

export const usePredictions = ({
  videoRef,
  overlayCanvasRef,
  offscreenCanvasRef,
  uploadedImageRef,
  uploadedDimensions,
  yoloModel,
  drawLabel,
  onLoadingChange,
  onDetections,
}: UsePredictionsOptions): UsePredictionsReturn => {
  const [frozen, setFrozen] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [frozenPredictions, setFrozenPredictions] = useState<Prediction[]>([]);
  const [showSlowDialog, setShowSlowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Persisted user preferences
  const [livePredictions, setLivePredictions] = useLocalStorage('dv3k-livePredictions', true);
  const [showPredictionScore, setShowPredictionScore] = useLocalStorage('dv3k-showPredictionScore', false);
  const [drawDomino, setDrawDomino] = useLocalStorage('dv3k-drawDomino', true);

  // Call onDetections callback when frozenPredictions changes
  useEffect(() => {
    if (onDetections) {
      onDetections(frozenPredictions);
    }
  }, [frozenPredictions, onDetections]);

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
    if (!isLoading && elapsedTime > 2000 && livePredictions && !showSlowDialog) {
      setLivePredictions(false);
      setShowSlowDialog(true);
    }
    setIsLoading(false);
    onLoadingChange(false);

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
  }, [videoRef, overlayCanvasRef, offscreenCanvasRef, yoloModel, frozen, isLoading, livePredictions, showPredictionScore, drawLabel, showSlowDialog, onLoadingChange, setLivePredictions]);

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
      } catch (err) {
        console.error('Error resuming video:', err);
      }
      setFrozen(false);
      setSnapshot(null);
      setFrozenPredictions([]);
    }
  }, [frozen, processPredictions, videoRef]);

  // Prediction interval effect
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
  }, [livePredictions, frozen, processPredictions, overlayCanvasRef]);

  // Drawing frozen predictions effect
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
  }, [frozen, frozenPredictions, showPredictionScore, drawLabel, uploadedDimensions, overlayCanvasRef, uploadedImageRef, videoRef]);

  return {
    frozen,
    snapshot,
    frozenPredictions,
    livePredictions,
    showPredictionScore,
    showSlowDialog,
    drawDomino,
    setFrozen,
    setSnapshot,
    setFrozenPredictions,
    setLivePredictions,
    setShowPredictionScore,
    setShowSlowDialog,
    setDrawDomino,
    processPredictions,
    toggleFreeze,
  };
};
