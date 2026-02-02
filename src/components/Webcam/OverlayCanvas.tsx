import React from 'react';
import { useWebcamContext } from './WebcamContext';

const OverlayCanvas: React.FC = () => {
  const {
    overlayCanvasRef,
    manualBoxMode,
    removeBoxMode,
    editBoxMode,
    handleCanvasClick,
  } = useWebcamContext();

  return (
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
  );
};

export default OverlayCanvas;
