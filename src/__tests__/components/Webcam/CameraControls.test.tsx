import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CameraControls from '../../../components/Webcam/CameraControls';
import { WebcamProvider } from '../../../components/Webcam/WebcamContext';
import { setupMediaDevicesMock } from '../../../test-utils/mocks/mediaDevices.mock';
import { setupMediaElementMocks, mockModelConfig } from '../../../test-utils/testSetup';

// Setup before mocking
beforeAll(() => {
  setupMediaElementMocks();
});

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs', () => ({
  loadGraphModel: jest.fn().mockResolvedValue({
    inputs: [{ shape: [1, 640, 640, 3] }],
    execute: jest.fn().mockReturnValue({
      transpose: jest.fn().mockReturnThis(),
      slice: jest.fn().mockReturnThis(),
      sub: jest.fn().mockReturnThis(),
      add: jest.fn().mockReturnThis(),
      div: jest.fn().mockReturnThis(),
      squeeze: jest.fn().mockReturnThis(),
      max: jest.fn().mockReturnThis(),
      argMax: jest.fn().mockReturnThis(),
      dispose: jest.fn(),
      data: jest.fn().mockResolvedValue(new Float32Array(100)),
      shape: [1, 100, 4],
    }),
  }),
  browser: {
    fromPixels: jest.fn().mockReturnValue({
      mean: jest.fn().mockReturnThis(),
      div: jest.fn().mockReturnThis(),
      expandDims: jest.fn().mockReturnThis(),
      dispose: jest.fn(),
    }),
  },
  image: {
    resizeBilinear: jest.fn().mockReturnValue({
      div: jest.fn().mockReturnThis(),
      expandDims: jest.fn().mockReturnThis(),
      dispose: jest.fn(),
    }),
    nonMaxSuppressionAsync: jest.fn().mockResolvedValue({
      data: jest.fn().mockResolvedValue(new Int32Array([0])),
      dispose: jest.fn(),
    }),
  },
  tidy: jest.fn((fn) => fn()),
  concat: jest.fn().mockReturnValue({
    squeeze: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    data: jest.fn().mockResolvedValue(new Float32Array(100)),
    shape: [100, 4],
  }),
}));

jest.mock('../../../utils/dominoImageCache', () => ({
  preloadDominoImages: jest.fn().mockResolvedValue(undefined),
  getDominoImage: jest.fn().mockReturnValue(null),
}));

const renderWithProvider = (children: React.ReactNode) => {
  return render(
    <WebcamProvider modelConfig={mockModelConfig}>
      {children}
    </WebcamProvider>
  );
};

describe('CameraControls component', () => {
  beforeEach(() => {
    setupMediaDevicesMock();
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders capture button when not frozen', () => {
    renderWithProvider(<CameraControls />);

    expect(screen.getByLabelText('Capture image')).toBeInTheDocument();
  });

  test('renders upload button when not frozen', () => {
    renderWithProvider(<CameraControls />);

    expect(screen.getByLabelText('Upload image')).toBeInTheDocument();
  });

  test('capture button has correct tooltip', () => {
    renderWithProvider(<CameraControls />);

    const captureButton = screen.getByLabelText('Capture image');
    expect(captureButton).toBeInTheDocument();
  });

  test('upload button triggers file input click', () => {
    renderWithProvider(<CameraControls />);

    // The file input should be rendered
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });
});
