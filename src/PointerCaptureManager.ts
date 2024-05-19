export type TReleasePointer = () => void;

export interface IPointerCaptureManager<Target> {
  capturePointer(target: Target, pointerId: number): TReleasePointer;
  hasCapture(pointerId: number): boolean;
  getCapture(pointerId: number): Target | undefined;
}

export const PointerCaptureManager = (() => {
  return { create };

  function create<Target>(): IPointerCaptureManager<Target> {
    const captures = new Map<number, Target>();

    return {
      capturePointer,
      getCapture,
      hasCapture,
    };

    function capturePointer(
      target: Target,
      pointerId: number,
    ): TReleasePointer {
      if (captures.has(pointerId)) {
        throw new Error(`Pointer ${pointerId} already captured`);
      }
      captures.set(pointerId, target);
      return () => releaseCapture(pointerId);
    }

    function releaseCapture(pointerId: number) {
      captures.delete(pointerId);
    }

    function hasCapture(pointerId: number): boolean {
      return captures.has(pointerId);
    }

    function getCapture(pointerId: number): Target | undefined {
      return captures.get(pointerId);
    }
  }
})();
