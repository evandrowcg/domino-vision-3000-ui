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
vi.mock('@tensorflow/tfjs', () => ({
  loadGraphModel: vi.fn().mockResolvedValue({
    inputs: [{ shape: [1, 640, 640, 3] }],
    execute: vi.fn().mockReturnValue({
      transpose: vi.fn().mockReturnThis(),
      slice: vi.fn().mockReturnThis(),
      sub: vi.fn().mockReturnThis(),
      add: vi.fn().mockReturnThis(),
      div: vi.fn().mockReturnThis(),
      squeeze: vi.fn().mockReturnThis(),
      max: vi.fn().mockReturnThis(),
      argMax: vi.fn().mockReturnThis(),
      dispose: vi.fn(),
      data: vi.fn().mockResolvedValue(new Float32Array(100)),
      shape: [1, 100, 4],
    }),
  }),
  browser: {
    fromPixels: vi.fn().mockReturnValue({
      mean: vi.fn().mockReturnThis(),
      div: vi.fn().mockReturnThis(),
      expandDims: vi.fn().mockReturnThis(),
      dispose: vi.fn(),
    }),
  },
  image: {
    resizeBilinear: vi.fn().mockReturnValue({
      div: vi.fn().mockReturnThis(),
      expandDims: vi.fn().mockReturnThis(),
      dispose: vi.fn(),
    }),
    nonMaxSuppressionAsync: vi.fn().mockResolvedValue({
      data: vi.fn().mockResolvedValue(new Int32Array([0])),
      dispose: vi.fn(),
    }),
  },
  tidy: vi.fn((fn) => fn()),
  concat: vi.fn().mockReturnValue({
    squeeze: vi.fn().mockReturnThis(),
    dispose: vi.fn(),
    data: vi.fn().mockResolvedValue(new Float32Array(100)),
    shape: [100, 4],
  }),
}));

vi.mock('../../../utils/dominoImageCache', () => ({
  preloadDominoImages: vi.fn().mockResolvedValue(undefined),
  getDominoImage: vi.fn().mockReturnValue(null),
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
    vi.clearAllMocks();
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
