import { useState, useCallback, RefObject } from 'react';
import { Prediction } from '../ai/YoloModelTF';

interface Point {
  x: number;
  y: number;
}

interface UseBoxEditingOptions {
  overlayCanvasRef: RefObject<HTMLCanvasElement | null>;
  uploadedImageRef: RefObject<HTMLImageElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  uploadedDimensions: { width: number; height: number } | null;
  frozen: boolean;
  frozenPredictions: Prediction[];
  setFrozenPredictions: React.Dispatch<React.SetStateAction<Prediction[]>>;
}

interface UseBoxEditingReturn {
  manualBoxMode: boolean;
  removeBoxMode: boolean;
  editBoxMode: boolean;
  editBoxIndex: number | null;
  manualBoxCoords: Point | null;
  showClassSelection: boolean;
  selectedStart: number;
  selectedEnd: number;
  setManualBoxMode: (mode: boolean) => void;
  setRemoveBoxMode: (mode: boolean) => void;
  setEditBoxMode: (mode: boolean) => void;
  setShowClassSelection: (show: boolean) => void;
  setSelectedStart: (value: number) => void;
  setSelectedEnd: (value: number) => void;
  handleCanvasClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleClassSelection: (selectedClass: string) => void;
  resetBoxEditingState: () => void;
}

export const useBoxEditing = ({
  overlayCanvasRef,
  uploadedImageRef,
  videoRef,
  uploadedDimensions,
  frozen,
  frozenPredictions,
  setFrozenPredictions,
}: UseBoxEditingOptions): UseBoxEditingReturn => {
  const [manualBoxMode, setManualBoxMode] = useState(false);
  const [removeBoxMode, setRemoveBoxMode] = useState(false);
  const [editBoxMode, setEditBoxMode] = useState(false);
  const [editBoxIndex, setEditBoxIndex] = useState<number | null>(null);
  const [manualBoxCoords, setManualBoxCoords] = useState<Point | null>(null);
  const [showClassSelection, setShowClassSelection] = useState(false);
  const [selectedStart, setSelectedStart] = useState(0);
  const [selectedEnd, setSelectedEnd] = useState(0);

  const resetBoxEditingState = useCallback(() => {
    setManualBoxMode(false);
    setManualBoxCoords(null);
    setShowClassSelection(false);
    setRemoveBoxMode(false);
    setEditBoxMode(false);
    setEditBoxIndex(null);
  }, []);

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
  }, [frozen, uploadedDimensions, manualBoxMode, removeBoxMode, editBoxMode, frozenPredictions, overlayCanvasRef, uploadedImageRef, videoRef, setFrozenPredictions]);

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
  }, [manualBoxMode, manualBoxCoords, editBoxMode, editBoxIndex, setFrozenPredictions]);

  return {
    manualBoxMode,
    removeBoxMode,
    editBoxMode,
    editBoxIndex,
    manualBoxCoords,
    showClassSelection,
    selectedStart,
    selectedEnd,
    setManualBoxMode,
    setRemoveBoxMode,
    setEditBoxMode,
    setShowClassSelection,
    setSelectedStart,
    setSelectedEnd,
    handleCanvasClick,
    handleClassSelection,
    resetBoxEditingState,
  };
};
