import { renderHook, act, waitFor } from '@testing-library/react';
import { useCamera } from '../../hooks/useCamera';
import { setupMediaDevicesMock, createMockMediaStream } from '../../test-utils/mocks/mediaDevices.mock';

// Mock HTMLMediaElement.prototype.play
beforeAll(() => {
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    writable: true,
    value: jest.fn().mockResolvedValue(undefined),
  });
});

describe('useCamera hook', () => {
  let mockMediaDevices: ReturnType<typeof setupMediaDevicesMock>;

  beforeEach(() => {
    mockMediaDevices = setupMediaDevicesMock();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('initializes with default values', () => {
    const videoRef = { current: document.createElement('video') };
    const { result } = renderHook(() => useCamera({ videoRef }));

    expect(result.current.lightOn).toBe(false);
    expect(result.current.showTorchDialog).toBe(false);
    expect(result.current.loading).toBe(true);
    expect(result.current.cameraError).toBeNull();
  });

  test('startVideo requests camera access', async () => {
    const videoRef = { current: document.createElement('video') };
    const { result } = renderHook(() => useCamera({ videoRef }));

    await act(async () => {
      await result.current.startVideo();
    });

    expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'environment' },
    });
  });

  test('startVideo sets camera error on NotAllowedError', async () => {
    mockMediaDevices = setupMediaDevicesMock({ shouldFail: true, errorName: 'NotAllowedError' });

    const videoRef = { current: document.createElement('video') };
    const { result } = renderHook(() => useCamera({ videoRef }));

    await act(async () => {
      await result.current.startVideo();
    });

    expect(result.current.cameraError).toBe(
      'Camera permission denied. Please allow camera access to use this feature.'
    );
  });

  test('startVideo sets camera error on NotFoundError', async () => {
    mockMediaDevices = setupMediaDevicesMock({ shouldFail: true, errorName: 'NotFoundError' });

    const videoRef = { current: document.createElement('video') };
    const { result } = renderHook(() => useCamera({ videoRef }));

    await act(async () => {
      await result.current.startVideo();
    });

    expect(result.current.cameraError).toBe(
      'No camera found. Please connect a camera to use this feature.'
    );
  });

  test('startVideo sets camera error on NotReadableError', async () => {
    mockMediaDevices = setupMediaDevicesMock({ shouldFail: true, errorName: 'NotReadableError' });

    const videoRef = { current: document.createElement('video') };
    const { result } = renderHook(() => useCamera({ videoRef }));

    await act(async () => {
      await result.current.startVideo();
    });

    expect(result.current.cameraError).toBe('Camera is in use by another application.');
  });

  test('startVideo clears camera error on success', async () => {
    const videoRef = { current: document.createElement('video') };
    const { result } = renderHook(() => useCamera({ videoRef }));

    // Set an initial error
    act(() => {
      result.current.setCameraError('Previous error');
    });

    expect(result.current.cameraError).toBe('Previous error');

    await act(async () => {
      await result.current.startVideo();
    });

    expect(result.current.cameraError).toBeNull();
  });

  test('setLoading updates loading state', () => {
    const videoRef = { current: document.createElement('video') };
    const { result } = renderHook(() => useCamera({ videoRef }));

    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.loading).toBe(false);
  });

  test('setShowTorchDialog updates dialog state', () => {
    const videoRef = { current: document.createElement('video') };
    const { result } = renderHook(() => useCamera({ videoRef }));

    expect(result.current.showTorchDialog).toBe(false);

    act(() => {
      result.current.setShowTorchDialog(true);
    });

    expect(result.current.showTorchDialog).toBe(true);
  });

  test('toggleLight shows dialog when torch is not supported', async () => {
    const mockStream = createMockMediaStream();
    const videoRef = {
      current: {
        srcObject: mockStream as unknown as MediaStream,
      } as HTMLVideoElement,
    };

    const { result } = renderHook(() => useCamera({ videoRef }));

    act(() => {
      result.current.toggleLight();
    });

    expect(result.current.showTorchDialog).toBe(true);
  });

  test('toggleLight toggles light when torch is supported', async () => {
    const mockStream = createMockMediaStream();
    mockStream.getVideoTracks()[0].getCapabilities = jest.fn().mockReturnValue({ torch: true });

    const videoRef = {
      current: {
        srcObject: mockStream as unknown as MediaStream,
      } as HTMLVideoElement,
    };

    const { result } = renderHook(() => useCamera({ videoRef }));

    expect(result.current.lightOn).toBe(false);

    await act(async () => {
      result.current.toggleLight();
    });

    await waitFor(() => {
      expect(result.current.lightOn).toBe(true);
    });
  });

  test('handles missing getUserMedia', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const videoRef = { current: document.createElement('video') };
    const { result } = renderHook(() => useCamera({ videoRef }));

    await act(async () => {
      await result.current.startVideo();
    });

    expect(result.current.cameraError).toBe('Camera access is not supported in this browser.');
  });

  test('stops tracks on cleanup', async () => {
    mockMediaDevices = setupMediaDevicesMock();
    const mockStream = createMockMediaStream();
    const stopMock = mockStream.getVideoTracks()[0].stop;

    const videoElement = document.createElement('video');
    videoElement.srcObject = mockStream as unknown as MediaStream;

    const videoRef = { current: videoElement };

    const { unmount } = renderHook(() => useCamera({ videoRef }));

    unmount();

    expect(stopMock).toHaveBeenCalled();
  });
});
