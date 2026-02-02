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

describe('ClassSelectionDialog component', () => {
  beforeEach(() => {
    setupMediaDevicesMock();
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
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
