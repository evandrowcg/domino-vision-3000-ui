const imageCache: Map<number, HTMLImageElement> = new Map();
let preloadPromise: Promise<void> | null = null;

export function preloadDominoImages(): Promise<void> {
  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = new Promise((resolve) => {
    const imagePromises: Promise<void>[] = [];

    for (let i = 0; i <= 12; i++) {
      const img = new Image();
      const promise = new Promise<void>((imgResolve) => {
        img.onload = () => {
          imageCache.set(i, img);
          imgResolve();
        };
        img.onerror = () => {
          console.warn(`Failed to preload domino image: domino_half_${i}.png`);
          imgResolve();
        };
      });
      img.src = `/images/domino_half_${i}.png`;
      imagePromises.push(promise);
    }

    Promise.all(imagePromises).then(() => resolve());
  });

  return preloadPromise;
}

export function getDominoImage(value: number): HTMLImageElement | null {
  if (value < 0 || value > 12) {
    return null;
  }
  return imageCache.get(value) ?? null;
}

export function isImageCacheReady(): boolean {
  return imageCache.size === 13;
}
