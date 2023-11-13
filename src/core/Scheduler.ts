/**
 * Simple abstraction on top of requestAnimationFrame
 */
export interface IScheduler {
  /**
   * Start the animation loop and reset the time
   */
  start(): void;
  /**
   * Get the time relative to the start of the animation loop
   * This value is updated on each frame.
   */
  time(): number;
  stop(): void;
}

export const Scheduler = (() => {
  return { create };

  function create(onFrame: (t: number) => void): IScheduler {
    let startTime = performance.now();
    let currentTime = startTime;
    let requestedFrameId: number | null = null;

    return {
      time,
      start,
      stop,
    };

    function time() {
      return currentTime;
    }

    function start() {
      if (requestedFrameId !== null) {
        // already running
        return;
      }
      startTime = performance.now();
      currentTime = startTime;
      loop();
    }

    function stop() {
      if (requestedFrameId === null) {
        // already stopped
        return;
      }
      cancelAnimationFrame(requestedFrameId);
      requestedFrameId = null;
    }

    function loop() {
      const t = performance.now() - startTime;
      currentTime = t;
      onFrame?.(t);
      requestedFrameId = requestAnimationFrame(loop);
    }
  }
})();
