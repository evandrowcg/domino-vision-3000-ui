// @ts-nocheck
// Test utility - type checking disabled to avoid issues with mock types

export const createMockCanvasContext = () => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  strokeRect: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 50 }),
  drawImage: vi.fn(),
  getImageData: vi.fn().mockReturnValue({
    data: new Uint8ClampedArray(640 * 480 * 4),
    width: 640,
    height: 480,
  }),
  putImageData: vi.fn(),
  createImageData: vi.fn().mockReturnValue({
    data: new Uint8ClampedArray(640 * 480 * 4),
    width: 640,
    height: 480,
  }),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textBaseline: 'alphabetic' as CanvasTextBaseline,
  textAlign: 'start' as CanvasTextAlign,
  globalAlpha: 1,
  globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
});

export const createMockCanvas = () => {
  const mockContext = createMockCanvasContext();

  return {
    getContext: vi.fn().mockReturnValue(mockContext),
    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mockImageData'),
    toBlob: vi.fn((callback: (blob: Blob | null) => void) => {
      callback(new Blob(['mock'], { type: 'image/png' }));
    }),
    width: 640,
    height: 480,
    style: {
      width: '640px',
      height: '480px',
    },
    getBoundingClientRect: vi.fn().mockReturnValue({
      top: 0,
      left: 0,
      width: 640,
      height: 480,
      right: 640,
      bottom: 480,
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    mockContext,
  };
};

let canvasMockSetup = false;
let mockCanvasInstance: ReturnType<typeof createMockCanvas> | null = null;

export const setupCanvasMock = () => {
  if (canvasMockSetup) {
    return mockCanvasInstance!;
  }

  const mockCanvas = createMockCanvas();
  mockCanvasInstance = mockCanvas;

  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName === 'canvas') {
      return createMockCanvas() as unknown as HTMLCanvasElement;
    }
    return originalCreateElement(tagName);
  });

  canvasMockSetup = true;
  return mockCanvas;
};

export const resetCanvasMock = () => {
  canvasMockSetup = false;
  mockCanvasInstance = null;
};

export const createMockImage = () => ({
  src: '',
  onload: null as ((this: HTMLImageElement, ev: Event) => unknown) | null,
  onerror: null as ((this: HTMLImageElement, ev: Event | string) => unknown) | null,
  width: 640,
  height: 480,
  naturalWidth: 640,
  naturalHeight: 480,
  complete: true,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});
