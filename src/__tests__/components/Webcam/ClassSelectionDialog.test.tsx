import React from 'react';
import { render, screen } from '@testing-library/react';
import ClassSelectionDialog from '../../../components/Webcam/ClassSelectionDialog';
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

describe('ClassSelectionDialog component', () => {
  beforeEach(() => {
    setupMediaDevicesMock();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('renders nothing when showClassSelection is false', () => {
    renderWithProvider(<ClassSelectionDialog />);

    // The dialog should not be visible initially
    expect(screen.queryByText('Domino:')).not.toBeInTheDocument();
  });

  test('component is defined and renders', () => {
    renderWithProvider(<ClassSelectionDialog />);

    // Component renders without crashing
    expect(ClassSelectionDialog).toBeDefined();
  });
});
