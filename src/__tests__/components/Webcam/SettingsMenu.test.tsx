import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsMenu from '../../../components/Webcam/SettingsMenu';
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

describe('SettingsMenu component', () => {
  beforeEach(() => {
    setupMediaDevicesMock();
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders menu button', () => {
    renderWithProvider(<SettingsMenu />);

    expect(screen.getByLabelText('Open settings menu')).toBeInTheDocument();
  });

  test('opens menu on button click', async () => {
    renderWithProvider(<SettingsMenu />);

    const menuButton = screen.getByLabelText('Open settings menu');
    fireEvent.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText('Live predictions')).toBeInTheDocument();
    });
  });

  test('shows all menu options', async () => {
    renderWithProvider(<SettingsMenu />);

    const menuButton = screen.getByLabelText('Open settings menu');
    fireEvent.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText('Live predictions')).toBeInTheDocument();
      expect(screen.getByText('Draw domino')).toBeInTheDocument();
      expect(screen.getByText('Predictions score')).toBeInTheDocument();
      expect(screen.getByText('Torch (Light)')).toBeInTheDocument();
    });
  });

  test('toggles live predictions', async () => {
    renderWithProvider(<SettingsMenu />);

    const menuButton = screen.getByLabelText('Open settings menu');
    fireEvent.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText('Live predictions')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Live predictions'));

    expect(localStorage.getItem('dv3k-livePredictions')).toBe('false');
  });

  test('menu options have checkboxes', async () => {
    renderWithProvider(<SettingsMenu />);

    const menuButton = screen.getByLabelText('Open settings menu');
    fireEvent.click(menuButton);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(4);
    });
  });
});
