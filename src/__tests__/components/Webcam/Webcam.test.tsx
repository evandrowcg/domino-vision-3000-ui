import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Webcam from '../../../components/Webcam/Webcam';
import { setupMediaDevicesMock } from '../../../test-utils/mocks/mediaDevices.mock';

// Mock HTMLMediaElement.prototype.play before any imports that might use it
beforeAll(() => {
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    writable: true,
    value: jest.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    writable: true,
    value: jest.fn(),
  });
});

// Create a chainable mock tensor
const createMockTensor = () => {
  const tensor: Record<string, unknown> = {
    data: jest.fn().mockResolvedValue(new Float32Array(100)),
    dispose: jest.fn(),
    shape: [1, 100, 4],
  };
  tensor.transpose = jest.fn().mockReturnValue(tensor);
  tensor.slice = jest.fn().mockReturnValue(tensor);
  tensor.sub = jest.fn().mockReturnValue(tensor);
  tensor.add = jest.fn().mockReturnValue(tensor);
  tensor.div = jest.fn().mockReturnValue(tensor);
  tensor.squeeze = jest.fn().mockReturnValue(tensor);
  tensor.max = jest.fn().mockReturnValue(tensor);
  tensor.argMax = jest.fn().mockReturnValue(tensor);
  tensor.mean = jest.fn().mockReturnValue(tensor);
  tensor.expandDims = jest.fn().mockReturnValue(tensor);
  return tensor;
};

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs', () => {
  const mockTensor = createMockTensor();
  return {
    loadGraphModel: jest.fn().mockResolvedValue({
      inputs: [{ shape: [1, 640, 640, 3] }],
      execute: jest.fn().mockReturnValue(mockTensor),
    }),
    browser: {
      fromPixels: jest.fn().mockReturnValue(mockTensor),
    },
    image: {
      resizeBilinear: jest.fn().mockReturnValue(mockTensor),
      nonMaxSuppressionAsync: jest.fn().mockResolvedValue({
        data: jest.fn().mockResolvedValue(new Int32Array([0])),
        dispose: jest.fn(),
      }),
    },
    tidy: jest.fn((fn) => {
      const result = fn();
      return result || mockTensor;
    }),
    concat: jest.fn().mockReturnValue(mockTensor),
  };
});

// Mock domino image cache
jest.mock('../../../utils/dominoImageCache', () => ({
  preloadDominoImages: jest.fn().mockResolvedValue(undefined),
  getDominoImage: jest.fn().mockReturnValue(null),
}));

const mockModelConfig = {
  modelUrl: '/models/test/model.json',
  modelClasses: ['0x0', '0x1', '1x1', '0x2', '1x2', '2x2'],
};

describe('Webcam component', () => {
  beforeEach(() => {
    setupMediaDevicesMock();
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', async () => {
    render(<Webcam modelConfig={mockModelConfig} />);

    // Should show loading initially
    expect(screen.getByText('Loading AI model...')).toBeInTheDocument();
  });

  test('renders camera controls after loading', async () => {
    render(<Webcam modelConfig={mockModelConfig} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading AI model...')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Should show capture button
    expect(screen.getByLabelText('Capture image')).toBeInTheDocument();
    expect(screen.getByLabelText('Upload image')).toBeInTheDocument();
  });

  test('renders settings menu button', () => {
    render(<Webcam modelConfig={mockModelConfig} />);

    expect(screen.getByLabelText('Open settings menu')).toBeInTheDocument();
  });

  test('opens settings menu on click', async () => {
    render(<Webcam modelConfig={mockModelConfig} />);

    const menuButton = screen.getByLabelText('Open settings menu');
    fireEvent.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText('Live predictions')).toBeInTheDocument();
      expect(screen.getByText('Draw domino')).toBeInTheDocument();
      expect(screen.getByText('Predictions score')).toBeInTheDocument();
      expect(screen.getByText('Torch (Light)')).toBeInTheDocument();
    });
  });

  test('toggles live predictions setting', async () => {
    render(<Webcam modelConfig={mockModelConfig} />);

    // Open menu
    const menuButton = screen.getByLabelText('Open settings menu');
    fireEvent.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText('Live predictions')).toBeInTheDocument();
    });

    // Click the live predictions option
    const livePredictionsOption = screen.getByText('Live predictions');
    fireEvent.click(livePredictionsOption);

    // The checkbox state should change
    expect(localStorage.getItem('dv3k-livePredictions')).toBe('false');
  });

  test('calls onDetections callback when provided', async () => {
    const onDetections = jest.fn();
    render(<Webcam modelConfig={mockModelConfig} onDetections={onDetections} />);

    // Initial call with empty predictions
    await waitFor(() => {
      expect(onDetections).toHaveBeenCalledWith([]);
    });
  });

  // Note: Camera error display tests are covered by LoadingOverlay.test.tsx unit tests
  // Integration tests for camera errors are skipped due to complex async initialization

  test('renders video element', () => {
    render(<Webcam modelConfig={mockModelConfig} />);

    const video = document.querySelector('video') as HTMLVideoElement;
    expect(video).toBeInTheDocument();
    // Video should be set up for playsinline behavior
    expect(video.hasAttribute('playsinline')).toBe(true);
  });

  test('renders overlay canvas', () => {
    render(<Webcam modelConfig={mockModelConfig} />);

    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  test('file input is hidden', () => {
    render(<Webcam modelConfig={mockModelConfig} />);

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveStyle({ display: 'none' });
  });
});
