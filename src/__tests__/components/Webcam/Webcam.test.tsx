import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Webcam from '../../../components/Webcam/Webcam';
import { setupMediaDevicesMock } from '../../../test-utils/mocks/mediaDevices.mock';

beforeAll(() => {
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    writable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
  // happy-dom strictly validates srcObject type; allow any value for testing
  Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', {
    configurable: true,
    get() { return this._srcObject ?? null; },
    set(val) { this._srcObject = val; },
  });
  // Provide non-zero dimensions so processPredictions can run and clear loading state
  Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
    configurable: true,
    get() { return 640; },
  });
  Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
    configurable: true,
    get() { return 480; },
  });
  // Mock getContext at prototype level so canvas elements remain real DOM nodes
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    fillRect: vi.fn(), clearRect: vi.fn(), strokeRect: vi.fn(),
    fillText: vi.fn(), measureText: vi.fn().mockReturnValue({ width: 50 }),
    drawImage: vi.fn(), save: vi.fn(), restore: vi.fn(),
    translate: vi.fn(), rotate: vi.fn(), beginPath: vi.fn(),
    fillStyle: '', strokeStyle: '', lineWidth: 1, font: '',
    textBaseline: 'alphabetic', textAlign: 'start',
  } as unknown as CanvasRenderingContext2D);
});

// Mock TensorFlow.js — factory is hoisted, so tensor must be inlined
vi.mock('@tensorflow/tfjs', () => {
  const t: Record<string, unknown> = {
    data: vi.fn().mockResolvedValue(new Float32Array(100)),
    dispose: vi.fn(),
    shape: [1, 100, 4],
  };
  t.transpose = vi.fn().mockReturnValue(t);
  t.slice = vi.fn().mockReturnValue(t);
  t.sub = vi.fn().mockReturnValue(t);
  t.add = vi.fn().mockReturnValue(t);
  t.div = vi.fn().mockReturnValue(t);
  t.squeeze = vi.fn().mockReturnValue(t);
  t.max = vi.fn().mockReturnValue(t);
  t.argMax = vi.fn().mockReturnValue(t);
  t.mean = vi.fn().mockReturnValue(t);
  t.expandDims = vi.fn().mockReturnValue(t);
  return {
    loadGraphModel: vi.fn().mockResolvedValue({
      inputs: [{ shape: [1, 640, 640, 3] }],
      execute: vi.fn().mockReturnValue(t),
    }),
    browser: { fromPixels: vi.fn().mockReturnValue(t) },
    image: {
      resizeBilinear: vi.fn().mockReturnValue(t),
      nonMaxSuppressionAsync: vi.fn().mockResolvedValue({
        data: vi.fn().mockResolvedValue(new Int32Array([0])),
        dispose: vi.fn(),
      }),
    },
    tidy: vi.fn((fn: () => unknown) => fn() || t),
    concat: vi.fn().mockReturnValue(t),
  };
});

// Mock domino image cache
vi.mock('../../../utils/dominoImageCache', () => ({
  preloadDominoImages: vi.fn().mockResolvedValue(undefined),
  getDominoImage: vi.fn().mockReturnValue(null),
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
    vi.clearAllMocks();
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
    const onDetections = vi.fn();
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
