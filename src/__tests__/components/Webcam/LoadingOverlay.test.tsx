import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Create a mock WebcamContext module
const mockContextValue = {
  loading: true,
  cameraError: null as string | null,
  startVideo: jest.fn(),
  fileInputRef: { current: null } as React.RefObject<HTMLInputElement | null>,
};

// Mock the WebcamContext
jest.mock('../../../components/Webcam/WebcamContext', () => ({
  useWebcamContext: () => mockContextValue,
}));

// Import after mocking
import LoadingOverlay from '../../../components/Webcam/LoadingOverlay';

describe('LoadingOverlay component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to loading state
    mockContextValue.loading = true;
    mockContextValue.cameraError = null;
  });

  test('shows loading text when loading is true', () => {
    mockContextValue.loading = true;
    mockContextValue.cameraError = null;

    render(<LoadingOverlay />);

    expect(screen.getByText('Loading AI model...')).toBeInTheDocument();
    expect(screen.getByText('This may take a moment')).toBeInTheDocument();
  });

  test('shows loading spinner when loading', () => {
    mockContextValue.loading = true;
    mockContextValue.cameraError = null;

    render(<LoadingOverlay />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('returns null when not loading and no error', () => {
    mockContextValue.loading = false;
    mockContextValue.cameraError = null;

    const { container } = render(<LoadingOverlay />);

    expect(container.firstChild).toBeNull();
  });

  test('shows camera error when cameraError is set', () => {
    mockContextValue.loading = false;
    mockContextValue.cameraError = 'Camera access denied';

    render(<LoadingOverlay />);

    expect(screen.getByText('Camera Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Camera access denied')).toBeInTheDocument();
  });

  test('shows try again button on camera error', () => {
    mockContextValue.loading = false;
    mockContextValue.cameraError = 'No camera found';

    render(<LoadingOverlay />);

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  test('shows upload image button on camera error', () => {
    mockContextValue.loading = false;
    mockContextValue.cameraError = 'No camera found';

    render(<LoadingOverlay />);

    expect(screen.getByText('Upload Image')).toBeInTheDocument();
  });

  test('calls startVideo when Try Again is clicked', () => {
    mockContextValue.loading = false;
    mockContextValue.cameraError = 'Camera error';

    render(<LoadingOverlay />);

    fireEvent.click(screen.getByText('Try Again'));

    expect(mockContextValue.startVideo).toHaveBeenCalled();
  });

  test('loading state takes precedence over error', () => {
    // If somehow both are set, loading should show
    mockContextValue.loading = true;
    mockContextValue.cameraError = 'Some error';

    render(<LoadingOverlay />);

    expect(screen.getByText('Loading AI model...')).toBeInTheDocument();
    expect(screen.queryByText('Camera Unavailable')).not.toBeInTheDocument();
  });
});
