// @ts-nocheck
// Test utility - type checking disabled to avoid issues with jest mock types
import { jest } from '@jest/globals';

export const createMockCanvasContext = () => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  strokeRect: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn().mockReturnValue({ width: 50 }),
  drawImage: jest.fn(),
  getImageData: jest.fn().mockReturnValue({
    data: new Uint8ClampedArray(640 * 480 * 4),
    width: 640,
    height: 480,
  }),
  putImageData: jest.fn(),
  createImageData: jest.fn().mockReturnValue({
    data: new Uint8ClampedArray(640 * 480 * 4),
    width: 640,
    height: 480,
  }),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn(),
  beginPath: jest.fn(),
  closePath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
  setTransform: jest.fn(),
  resetTransform: jest.fn(),
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
    getContext: jest.fn().mockReturnValue(mockContext),
    toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mockImageData'),
    toBlob: jest.fn((callback: (blob: Blob | null) => void) => {
      callback(new Blob(['mock'], { type: 'image/png' }));
    }),
    width: 640,
    height: 480,
    style: {
      width: '640px',
      height: '480px',
    },
    getBoundingClientRect: jest.fn().mockReturnValue({
      top: 0,
      left: 0,
      width: 640,
      height: 480,
      right: 640,
      bottom: 480,
    }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
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
  jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
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
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
});
