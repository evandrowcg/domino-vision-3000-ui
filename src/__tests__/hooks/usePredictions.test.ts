import { renderHook, act, waitFor } from '@testing-library/react';
import { usePredictions } from '../../hooks/usePredictions';
import { createMockCanvas } from '../../test-utils/mocks/canvas.mock';

// Mock HTMLMediaElement
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

describe('usePredictions hook', () => {
  const mockPredictions = [
    { class: '3x5', score: 0.95, bbox: [10, 20, 50, 50] as [number, number, number, number] },
    { class: '6x6', score: 0.88, bbox: [100, 100, 50, 50] as [number, number, number, number] },
  ];

  const mockYoloModel = {
    predict: jest.fn().mockResolvedValue(mockPredictions),
  };

  const mockDrawLabel = jest.fn();
  const mockOnLoadingChange = jest.fn();
  const mockOnDetections = jest.fn();

  const createMockRefs = () => {
    const videoElement = document.createElement('video');
    Object.defineProperty(videoElement, 'videoWidth', { value: 640, writable: true });
    Object.defineProperty(videoElement, 'videoHeight', { value: 480, writable: true });
    Object.defineProperty(videoElement, 'clientWidth', { value: 640, writable: true });
    Object.defineProperty(videoElement, 'clientHeight', { value: 480, writable: true });
    videoElement.play = jest.fn().mockResolvedValue(undefined);
    videoElement.pause = jest.fn();

    const overlayCanvas = createMockCanvas();
    const offscreenCanvas = createMockCanvas();

    return {
      videoRef: { current: videoElement },
      overlayCanvasRef: { current: overlayCanvas as unknown as HTMLCanvasElement },
      offscreenCanvasRef: { current: offscreenCanvas as unknown as HTMLCanvasElement },
      uploadedImageRef: { current: null },
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorage.clear();
    mockYoloModel.predict.mockResolvedValue(mockPredictions);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('initializes with default values', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      usePredictions({
        ...refs,
        uploadedDimensions: null,
        yoloModel: mockYoloModel,
        drawLabel: mockDrawLabel,
        onLoadingChange: mockOnLoadingChange,
      })
    );

    expect(result.current.frozen).toBe(false);
    expect(result.current.snapshot).toBeNull();
    expect(result.current.frozenPredictions).toEqual([]);
    expect(result.current.livePredictions).toBe(true);
    expect(result.current.showPredictionScore).toBe(false);
    expect(result.current.showSlowDialog).toBe(false);
    expect(result.current.drawDomino).toBe(true);
  });

  test('setLivePredictions persists to localStorage', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      usePredictions({
        ...refs,
        uploadedDimensions: null,
        yoloModel: mockYoloModel,
        drawLabel: mockDrawLabel,
        onLoadingChange: mockOnLoadingChange,
      })
    );

    act(() => {
      result.current.setLivePredictions(false);
    });

    expect(result.current.livePredictions).toBe(false);
    expect(localStorage.getItem('dv3k-livePredictions')).toBe('false');
  });

  test('setShowPredictionScore persists to localStorage', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      usePredictions({
        ...refs,
        uploadedDimensions: null,
        yoloModel: mockYoloModel,
        drawLabel: mockDrawLabel,
        onLoadingChange: mockOnLoadingChange,
      })
    );

    act(() => {
      result.current.setShowPredictionScore(true);
    });

    expect(result.current.showPredictionScore).toBe(true);
    expect(localStorage.getItem('dv3k-showPredictionScore')).toBe('true');
  });

  test('setDrawDomino persists to localStorage', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      usePredictions({
        ...refs,
        uploadedDimensions: null,
        yoloModel: mockYoloModel,
        drawLabel: mockDrawLabel,
        onLoadingChange: mockOnLoadingChange,
      })
    );

    act(() => {
      result.current.setDrawDomino(false);
    });

    expect(result.current.drawDomino).toBe(false);
    expect(localStorage.getItem('dv3k-drawDomino')).toBe('false');
  });

  test('onDetections callback is called with initial empty array', async () => {
    const refs = createMockRefs();
    renderHook(() =>
      usePredictions({
        ...refs,
        uploadedDimensions: null,
        yoloModel: mockYoloModel,
        drawLabel: mockDrawLabel,
        onLoadingChange: mockOnLoadingChange,
        onDetections: mockOnDetections,
      })
    );

    // Initial call with empty array
    expect(mockOnDetections).toHaveBeenCalledWith([]);
  });

  test('setFrozenPredictions updates predictions manually', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      usePredictions({
        ...refs,
        uploadedDimensions: null,
        yoloModel: mockYoloModel,
        drawLabel: mockDrawLabel,
        onLoadingChange: mockOnLoadingChange,
      })
    );

    const newPredictions = [
      { class: '1x2', score: 0.9, bbox: [0, 0, 50, 50] as [number, number, number, number] },
    ];

    act(() => {
      result.current.setFrozenPredictions(newPredictions);
    });

    expect(result.current.frozenPredictions).toEqual(newPredictions);
  });

  test('handles video not ready gracefully', async () => {
    const refs = createMockRefs();
    Object.defineProperty(refs.videoRef.current, 'videoWidth', { value: 0, writable: true });

    const { result } = renderHook(() =>
      usePredictions({
        ...refs,
        uploadedDimensions: null,
        yoloModel: mockYoloModel,
        drawLabel: mockDrawLabel,
        onLoadingChange: mockOnLoadingChange,
      })
    );

    const predictions = await act(async () => {
      return await result.current.processPredictions();
    });

    expect(predictions).toEqual([]);
  });

  test('setShowSlowDialog updates slow dialog state', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      usePredictions({
        ...refs,
        uploadedDimensions: null,
        yoloModel: mockYoloModel,
        drawLabel: mockDrawLabel,
        onLoadingChange: mockOnLoadingChange,
      })
    );

    act(() => {
      result.current.setShowSlowDialog(true);
    });

    expect(result.current.showSlowDialog).toBe(true);
  });

  test('setSnapshot updates snapshot state', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      usePredictions({
        ...refs,
        uploadedDimensions: null,
        yoloModel: mockYoloModel,
        drawLabel: mockDrawLabel,
        onLoadingChange: mockOnLoadingChange,
      })
    );

    act(() => {
      result.current.setSnapshot('data:image/png;base64,test');
    });

    expect(result.current.snapshot).toBe('data:image/png;base64,test');
  });

  test('setFrozen updates frozen state', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      usePredictions({
        ...refs,
        uploadedDimensions: null,
        yoloModel: mockYoloModel,
        drawLabel: mockDrawLabel,
        onLoadingChange: mockOnLoadingChange,
      })
    );

    act(() => {
      result.current.setFrozen(true);
    });

    expect(result.current.frozen).toBe(true);
  });
});
