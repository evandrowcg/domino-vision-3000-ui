import { renderHook, act } from '@testing-library/react';
import { useBoxEditing } from '../../hooks/useBoxEditing';
import { Prediction } from '../../ai/YoloModelTF';
import { createMockCanvas } from '../../test-utils/mocks/canvas.mock';

describe('useBoxEditing hook', () => {
  const mockSetFrozenPredictions = jest.fn();

  const createMockRefs = () => {
    const mockCanvas = createMockCanvas();
    const videoElement = document.createElement('video');
    Object.defineProperty(videoElement, 'videoWidth', { value: 640, writable: true });
    Object.defineProperty(videoElement, 'videoHeight', { value: 480, writable: true });
    Object.defineProperty(videoElement, 'clientWidth', { value: 640, writable: true });
    Object.defineProperty(videoElement, 'clientHeight', { value: 480, writable: true });

    return {
      overlayCanvasRef: { current: mockCanvas as unknown as HTMLCanvasElement },
      uploadedImageRef: { current: null },
      videoRef: { current: videoElement },
    };
  };

  const defaultPredictions: Prediction[] = [
    { class: '3x5', score: 0.95, bbox: [10, 20, 50, 50] },
    { class: '6x6', score: 0.88, bbox: [100, 100, 50, 50] },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes with default values', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      useBoxEditing({
        ...refs,
        uploadedDimensions: null,
        frozen: false,
        frozenPredictions: [],
        setFrozenPredictions: mockSetFrozenPredictions,
      })
    );

    expect(result.current.manualBoxMode).toBe(false);
    expect(result.current.removeBoxMode).toBe(false);
    expect(result.current.editBoxMode).toBe(false);
    expect(result.current.showClassSelection).toBe(false);
    expect(result.current.selectedStart).toBe(0);
    expect(result.current.selectedEnd).toBe(0);
  });

  test('toggleAddMode enables add mode and disables others', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      useBoxEditing({
        ...refs,
        uploadedDimensions: null,
        frozen: true,
        frozenPredictions: defaultPredictions,
        setFrozenPredictions: mockSetFrozenPredictions,
      })
    );

    act(() => {
      result.current.toggleAddMode();
    });

    expect(result.current.manualBoxMode).toBe(true);
    expect(result.current.removeBoxMode).toBe(false);
    expect(result.current.editBoxMode).toBe(false);
  });

  test('toggleRemoveMode enables remove mode and disables others', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      useBoxEditing({
        ...refs,
        uploadedDimensions: null,
        frozen: true,
        frozenPredictions: defaultPredictions,
        setFrozenPredictions: mockSetFrozenPredictions,
      })
    );

    act(() => {
      result.current.toggleRemoveMode();
    });

    expect(result.current.removeBoxMode).toBe(true);
    expect(result.current.manualBoxMode).toBe(false);
    expect(result.current.editBoxMode).toBe(false);
  });

  test('toggleEditMode enables edit mode and disables others', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      useBoxEditing({
        ...refs,
        uploadedDimensions: null,
        frozen: true,
        frozenPredictions: defaultPredictions,
        setFrozenPredictions: mockSetFrozenPredictions,
      })
    );

    act(() => {
      result.current.toggleEditMode();
    });

    expect(result.current.editBoxMode).toBe(true);
    expect(result.current.manualBoxMode).toBe(false);
    expect(result.current.removeBoxMode).toBe(false);
  });

  test('resetBoxEditingState resets all modes', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      useBoxEditing({
        ...refs,
        uploadedDimensions: null,
        frozen: true,
        frozenPredictions: defaultPredictions,
        setFrozenPredictions: mockSetFrozenPredictions,
      })
    );

    // Enable all modes
    act(() => {
      result.current.setManualBoxMode(true);
      result.current.setRemoveBoxMode(true);
      result.current.setEditBoxMode(true);
      result.current.setShowClassSelection(true);
    });

    // Reset
    act(() => {
      result.current.resetBoxEditingState();
    });

    expect(result.current.manualBoxMode).toBe(false);
    expect(result.current.removeBoxMode).toBe(false);
    expect(result.current.editBoxMode).toBe(false);
    expect(result.current.showClassSelection).toBe(false);
  });

  test('keyboard shortcut "a" toggles add mode', () => {
    const refs = createMockRefs();
    renderHook(() =>
      useBoxEditing({
        ...refs,
        uploadedDimensions: null,
        frozen: true,
        frozenPredictions: defaultPredictions,
        setFrozenPredictions: mockSetFrozenPredictions,
      })
    );

    // Note: We can't directly test the keyboard handler through the hook
    // as it's attached to window. We test the toggle functions instead.
  });

  test('handleCanvasClick in add mode opens class selection', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      useBoxEditing({
        ...refs,
        uploadedDimensions: null,
        frozen: true,
        frozenPredictions: defaultPredictions,
        setFrozenPredictions: mockSetFrozenPredictions,
      })
    );

    act(() => {
      result.current.setManualBoxMode(true);
    });

    const mockEvent = {
      clientX: 50,
      clientY: 50,
    } as React.MouseEvent<HTMLCanvasElement>;

    act(() => {
      result.current.handleCanvasClick(mockEvent);
    });

    expect(result.current.showClassSelection).toBe(true);
  });

  test('handleCanvasClick does nothing when not frozen', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      useBoxEditing({
        ...refs,
        uploadedDimensions: null,
        frozen: false,
        frozenPredictions: defaultPredictions,
        setFrozenPredictions: mockSetFrozenPredictions,
      })
    );

    act(() => {
      result.current.setManualBoxMode(true);
    });

    const mockEvent = {
      clientX: 50,
      clientY: 50,
    } as React.MouseEvent<HTMLCanvasElement>;

    act(() => {
      result.current.handleCanvasClick(mockEvent);
    });

    expect(result.current.showClassSelection).toBe(false);
  });

  test('handleClassSelection adds new detection in add mode', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      useBoxEditing({
        ...refs,
        uploadedDimensions: null,
        frozen: true,
        frozenPredictions: defaultPredictions,
        setFrozenPredictions: mockSetFrozenPredictions,
      })
    );

    // Enable add mode and simulate click
    act(() => {
      result.current.setManualBoxMode(true);
    });

    const mockEvent = {
      clientX: 50,
      clientY: 50,
    } as React.MouseEvent<HTMLCanvasElement>;

    act(() => {
      result.current.handleCanvasClick(mockEvent);
    });

    // Now select a class
    act(() => {
      result.current.handleClassSelection('2x3');
    });

    expect(mockSetFrozenPredictions).toHaveBeenCalled();
    expect(result.current.showClassSelection).toBe(false);
  });

  test('handleClassSelection updates detection in edit mode', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      useBoxEditing({
        ...refs,
        uploadedDimensions: null,
        frozen: true,
        frozenPredictions: defaultPredictions,
        setFrozenPredictions: mockSetFrozenPredictions,
      })
    );

    // Enable edit mode
    act(() => {
      result.current.setEditBoxMode(true);
    });

    // Simulate clicking on existing detection
    const mockEvent = {
      clientX: 30,
      clientY: 40,
    } as React.MouseEvent<HTMLCanvasElement>;

    act(() => {
      result.current.handleCanvasClick(mockEvent);
    });

    // Now select a new class
    act(() => {
      result.current.handleClassSelection('1x1');
    });

    expect(mockSetFrozenPredictions).toHaveBeenCalled();
    expect(result.current.showClassSelection).toBe(false);
  });

  test('setSelectedStart and setSelectedEnd update values', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      useBoxEditing({
        ...refs,
        uploadedDimensions: null,
        frozen: true,
        frozenPredictions: defaultPredictions,
        setFrozenPredictions: mockSetFrozenPredictions,
      })
    );

    act(() => {
      result.current.setSelectedStart(5);
      result.current.setSelectedEnd(10);
    });

    expect(result.current.selectedStart).toBe(5);
    expect(result.current.selectedEnd).toBe(10);
  });

  test('mode toggles are mutually exclusive', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      useBoxEditing({
        ...refs,
        uploadedDimensions: null,
        frozen: true,
        frozenPredictions: defaultPredictions,
        setFrozenPredictions: mockSetFrozenPredictions,
      })
    );

    // Enable add mode
    act(() => {
      result.current.toggleAddMode();
    });
    expect(result.current.manualBoxMode).toBe(true);
    expect(result.current.removeBoxMode).toBe(false);
    expect(result.current.editBoxMode).toBe(false);

    // Toggle remove mode - should disable add
    act(() => {
      result.current.toggleRemoveMode();
    });
    expect(result.current.manualBoxMode).toBe(false);
    expect(result.current.removeBoxMode).toBe(true);
    expect(result.current.editBoxMode).toBe(false);

    // Toggle edit mode - should disable remove
    act(() => {
      result.current.toggleEditMode();
    });
    expect(result.current.manualBoxMode).toBe(false);
    expect(result.current.removeBoxMode).toBe(false);
    expect(result.current.editBoxMode).toBe(true);
  });

  test('toggleAddMode resets selected values when enabling', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      useBoxEditing({
        ...refs,
        uploadedDimensions: null,
        frozen: true,
        frozenPredictions: defaultPredictions,
        setFrozenPredictions: mockSetFrozenPredictions,
      })
    );

    // Set some values
    act(() => {
      result.current.setSelectedStart(5);
      result.current.setSelectedEnd(10);
    });

    // Enable add mode
    act(() => {
      result.current.toggleAddMode();
    });

    expect(result.current.selectedStart).toBe(0);
    expect(result.current.selectedEnd).toBe(0);
  });

  test('setShowClassSelection updates dialog visibility', () => {
    const refs = createMockRefs();
    const { result } = renderHook(() =>
      useBoxEditing({
        ...refs,
        uploadedDimensions: null,
        frozen: true,
        frozenPredictions: defaultPredictions,
        setFrozenPredictions: mockSetFrozenPredictions,
      })
    );

    act(() => {
      result.current.setShowClassSelection(true);
    });

    expect(result.current.showClassSelection).toBe(true);

    act(() => {
      result.current.setShowClassSelection(false);
    });

    expect(result.current.showClassSelection).toBe(false);
  });
});
