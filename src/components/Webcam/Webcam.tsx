import React from 'react';
import { Card, CardContent } from '@mui/material';
import { ModelConfig } from '../../ai/ModelConfig';
import { Prediction } from '../../ai/YoloModelTF';
import { WebcamProvider } from './WebcamContext';
import VideoDisplay from './VideoDisplay';
import OverlayCanvas from './OverlayCanvas';
import CameraControls from './CameraControls';
import SettingsMenu from './SettingsMenu';
import ClassSelectionDialog from './ClassSelectionDialog';
import WarningDialogs from './WarningDialogs';
import LoadingOverlay from './LoadingOverlay';

interface WebcamProps {
  modelConfig: ModelConfig;
  onDetections?: (detections: Prediction[]) => void;
}

const WebcamContent: React.FC = () => {
  return (
    <>
      <Card style={{ maxWidth: 800, margin: '20px auto 0', color: 'black' }}>
        <CardContent>
          <div style={{ position: 'relative', width: '100%' }}>
            <VideoDisplay />
            <OverlayCanvas />
            <SettingsMenu />
            <LoadingOverlay />
            <ClassSelectionDialog />
          </div>
          <CameraControls />
        </CardContent>
      </Card>
      <WarningDialogs />
    </>
  );
};

const Webcam: React.FC<WebcamProps> = ({ modelConfig, onDetections }) => {
  return (
    <WebcamProvider modelConfig={modelConfig} onDetections={onDetections}>
      <WebcamContent />
    </WebcamProvider>
  );
};

export default Webcam;
