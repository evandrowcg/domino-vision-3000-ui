import React, { createContext, useContext, useRef, useEffect, useMemo, useCallback, useState, RefObject } from 'react';
import { ModelConfig } from '../../ai/ModelConfig';
import { YoloModelTF, Prediction } from '../../ai/YoloModelTF';
import { preloadDominoImages, getDominoImage } from '../../utils/dominoImageCache';
import { useCamera } from '../../hooks/useCamera';
import { usePredictions } from '../../hooks/usePredictions';
import { useBoxEditing } from '../../hooks/useBoxEditing';

interface WebcamContextValue {
  // Refs
  videoRef: RefObject<HTMLVideoElement | null>;
  overlayCanvasRef: RefObject<HTMLCanvasElement | null>;
  offscreenCanvasRef: RefObject<HTMLCanvasElement>;
  uploadedImageRef: RefObject<HTMLImageElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;

  // Camera hook values
  lightOn: boolean;
  showTorchDialog: boolean;
  loading: boolean;
  cameraError: string | null;
  setShowTorchDialog: (show: boolean) => void;
  setCameraError: (error: string | null) => void;
  toggleLight: () => void;
  startVideo: () => Promise<void>;

  // Predictions hook values
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

  // Box editing hook values
  manualBoxMode: boolean;
  removeBoxMode: boolean;
  editBoxMode: boolean;
  showClassSelection: boolean;
  selectedStart: number;
  selectedEnd: number;
  setShowClassSelection: (show: boolean) => void;
  setSelectedStart: (value: number) => void;
  setSelectedEnd: (value: number) => void;
  handleCanvasClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleClassSelection: (selectedClass: string) => void;
  resetBoxEditingState: () => void;
  toggleAddMode: () => void;
  toggleRemoveMode: () => void;
  toggleEditMode: () => void;

  // Upload handling
  uploadedDimensions: { width: number; height: number } | null;
  setUploadedDimensions: (dims: { width: number; height: number } | null) => void;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;

  // Menu state
  menuAnchorEl: HTMLElement | null;
  setMenuAnchorEl: (el: HTMLElement | null) => void;

  // Model
  yoloModel: YoloModelTF;
}

const WebcamContext = createContext<WebcamContextValue | null>(null);

interface WebcamProviderProps {
  children: React.ReactNode;
  modelConfig: ModelConfig;
  onDetections?: (detections: Prediction[]) => void;
}

export const WebcamProvider: React.FC<WebcamProviderProps> = ({
  children,
  modelConfig,
  onDetections,
}) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const uploadedImageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [uploadedDimensions, setUploadedDimensions] = useState<{ width: number; height: number } | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);

  // Model instance
  const yoloModel = useMemo(
    () => new YoloModelTF(modelConfig.modelUrl, modelConfig.modelClasses),
    [modelConfig.modelUrl, modelConfig.modelClasses]
  );

  // Camera hook
  const camera = useCamera({ videoRef });

  // Draw label helper
  const drawLabel = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, label: string, drawDominoImages: boolean) => {
      const fontSize = 18;
      const padding = 2;
      ctx.font = `${fontSize}px Arial`;
      ctx.textBaseline = 'middle';

      const classOnly = label.split(' ')[0];
      const textWidth = ctx.measureText(label).width;

      let dominoImagesWidth = 0;
      let leftDomino: HTMLImageElement | null = null;
      let rightDomino: HTMLImageElement | null = null;
      const dominoHeight = 20;
      const dominoWidth = dominoHeight;

      if (drawDominoImages && classOnly.includes('x')) {
        const parts = classOnly.split('x');
        if (parts.length === 2 && !isNaN(+parts[0]) && !isNaN(+parts[1])) {
          dominoImagesWidth = dominoWidth * 2;
          leftDomino = getDominoImage(+parts[0]);
          rightDomino = getDominoImage(+parts[1]);
        }
      }

      const rectWidth = textWidth + padding * 2 + dominoImagesWidth;
      const rectHeight = fontSize + 2 * padding;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(x - padding, y - rectHeight - 1, rectWidth, rectHeight);

      ctx.fillStyle = 'white';
      ctx.fillText(label, x, y - rectHeight / 2);

      if (leftDomino && rightDomino) {
        const imageY = y - rectHeight;
        const leftX = x + textWidth + padding;
        const rightX = leftX + dominoWidth;

        ctx.drawImage(leftDomino, leftX, imageY, dominoWidth, dominoHeight);

        ctx.save();
        ctx.translate(rightX + dominoWidth / 2, imageY + dominoHeight / 2);
        ctx.rotate(Math.PI);
        ctx.drawImage(rightDomino, -dominoWidth / 2, -dominoHeight / 2, dominoWidth, dominoHeight);
        ctx.restore();
      }
    },
    []
  );

  // Predictions hook
  const predictions = usePredictions({
    videoRef,
    overlayCanvasRef,
    offscreenCanvasRef,
    uploadedImageRef,
    uploadedDimensions,
    yoloModel,
    drawLabel,
    onLoadingChange: camera.setLoading,
    onDetections,
  });

  // Box editing hook
  const boxEditing = useBoxEditing({
    overlayCanvasRef,
    uploadedImageRef,
    videoRef,
    uploadedDimensions,
    frozen: predictions.frozen,
    frozenPredictions: predictions.frozenPredictions,
    setFrozenPredictions: predictions.setFrozenPredictions,
  });

  // Image upload handler
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
          predictions.setSnapshot(resizedDataUrl);
          setUploadedDimensions({ width: targetWidth, height: targetHeight });
          predictions.setFrozen(true);
          const preds = await yoloModel.predict(resizeCanvas);
          predictions.setFrozenPredictions(preds.sort((a, b) => b.score - a.score));
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  }, [yoloModel, predictions]);

  // Model initialization and image preloading
  // This effect should only run once on mount to initialize the model and camera
  useEffect(() => {
    (async () => {
      try {
        await Promise.all([
          yoloModel.loadModel(),
          preloadDominoImages(),
        ]);
        camera.startVideo();
      } catch (error) {
        console.error('Error initializing model or camera:', error);
        camera.setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yoloModel]);

  // Extended toggleFreeze that also resets box editing and uploaded dimensions
  const extendedToggleFreeze = useCallback(async () => {
    if (predictions.frozen) {
      // Resuming - reset all editing state
      boxEditing.resetBoxEditingState();
      setUploadedDimensions(null);
    }
    await predictions.toggleFreeze();
  }, [predictions, boxEditing]);

  const value: WebcamContextValue = {
    // Refs
    videoRef,
    overlayCanvasRef,
    offscreenCanvasRef,
    uploadedImageRef,
    fileInputRef,

    // Camera
    lightOn: camera.lightOn,
    showTorchDialog: camera.showTorchDialog,
    loading: camera.loading,
    cameraError: camera.cameraError,
    setShowTorchDialog: camera.setShowTorchDialog,
    setCameraError: camera.setCameraError,
    toggleLight: camera.toggleLight,
    startVideo: camera.startVideo,

    // Predictions
    frozen: predictions.frozen,
    snapshot: predictions.snapshot,
    frozenPredictions: predictions.frozenPredictions,
    livePredictions: predictions.livePredictions,
    showPredictionScore: predictions.showPredictionScore,
    showSlowDialog: predictions.showSlowDialog,
    drawDomino: predictions.drawDomino,
    setFrozen: predictions.setFrozen,
    setSnapshot: predictions.setSnapshot,
    setFrozenPredictions: predictions.setFrozenPredictions,
    setLivePredictions: predictions.setLivePredictions,
    setShowPredictionScore: predictions.setShowPredictionScore,
    setShowSlowDialog: predictions.setShowSlowDialog,
    setDrawDomino: predictions.setDrawDomino,
    processPredictions: predictions.processPredictions,
    toggleFreeze: extendedToggleFreeze,

    // Box editing
    manualBoxMode: boxEditing.manualBoxMode,
    removeBoxMode: boxEditing.removeBoxMode,
    editBoxMode: boxEditing.editBoxMode,
    showClassSelection: boxEditing.showClassSelection,
    selectedStart: boxEditing.selectedStart,
    selectedEnd: boxEditing.selectedEnd,
    setShowClassSelection: boxEditing.setShowClassSelection,
    setSelectedStart: boxEditing.setSelectedStart,
    setSelectedEnd: boxEditing.setSelectedEnd,
    handleCanvasClick: boxEditing.handleCanvasClick,
    handleClassSelection: boxEditing.handleClassSelection,
    resetBoxEditingState: boxEditing.resetBoxEditingState,
    toggleAddMode: boxEditing.toggleAddMode,
    toggleRemoveMode: boxEditing.toggleRemoveMode,
    toggleEditMode: boxEditing.toggleEditMode,

    // Upload
    uploadedDimensions,
    setUploadedDimensions,
    handleImageUpload,

    // Menu
    menuAnchorEl,
    setMenuAnchorEl,

    // Model
    yoloModel,
  };

  return (
    <WebcamContext.Provider value={value}>
      {children}
    </WebcamContext.Provider>
  );
};

export const useWebcamContext = (): WebcamContextValue => {
  const context = useContext(WebcamContext);
  if (!context) {
    throw new Error('useWebcamContext must be used within a WebcamProvider');
  }
  return context;
};
