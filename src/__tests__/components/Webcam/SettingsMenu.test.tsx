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

describe('SettingsMenu component', () => {
  beforeEach(() => {
    setupMediaDevicesMock();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
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
