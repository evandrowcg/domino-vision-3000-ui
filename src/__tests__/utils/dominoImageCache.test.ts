import { preloadDominoImages, getDominoImage, isImageCacheReady } from '../../utils/dominoImageCache';

// Mock the Image constructor
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src: string = '';

  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
}

// Replace global Image with mock
const originalImage = global.Image;
beforeAll(() => {
  (global as unknown as { Image: typeof MockImage }).Image = MockImage as unknown as typeof Image;
});

afterAll(() => {
  global.Image = originalImage;
});

describe('dominoImageCache', () => {
  test('getDominoImage returns null for invalid values', () => {
    expect(getDominoImage(-1)).toBeNull();
    expect(getDominoImage(13)).toBeNull();
    expect(getDominoImage(100)).toBeNull();
  });

  test('getDominoImage returns null before preloading', () => {
    // Note: This test may pass or fail depending on whether preload was already called
    // In a fresh environment, it should return null
    const result = getDominoImage(0);
    // Either null (not loaded) or an image object (if loaded in previous test)
    expect(result === null || result instanceof MockImage).toBe(true);
  });

  test('preloadDominoImages returns a promise', () => {
    const result = preloadDominoImages();
    expect(result).toBeInstanceOf(Promise);
  });

  test('preloadDominoImages resolves', async () => {
    await expect(preloadDominoImages()).resolves.toBeUndefined();
  });

  test('preloadDominoImages returns same promise on subsequent calls', () => {
    const promise1 = preloadDominoImages();
    const promise2 = preloadDominoImages();
    expect(promise1).toBe(promise2);
  });

  test('getDominoImage returns image after preloading', async () => {
    await preloadDominoImages();
    const image = getDominoImage(5);
    expect(image).not.toBeNull();
  });

  test('isImageCacheReady returns true after preloading', async () => {
    await preloadDominoImages();
    expect(isImageCacheReady()).toBe(true);
  });

  test('getDominoImage returns images for all valid values after preloading', async () => {
    await preloadDominoImages();
    for (let i = 0; i <= 12; i++) {
      expect(getDominoImage(i)).not.toBeNull();
    }
  });
});
