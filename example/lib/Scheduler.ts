export interface IScreduler {
  getTime(): number;
  start(): void;
  stop(): void;
}

export interface ScredulerOptions {
  onFrame?: (t: number) => void;
  // start the animation loop (default: true)
  autoStart?: boolean;
}

export const Screduler = (() => {
  return { create };

  function create({ autoStart, onFrame }: ScredulerOptions = {}): IScreduler {
    let startTime = performance.now();
    let currentTime = startTime;
    let requestedFrameId: number | null = null;

    if (autoStart) {
      start();
    }

    return {
      getTime,
      start,
      stop,
    };

    function getTime() {
      return currentTime;
    }

    function start() {
      if (requestedFrameId !== null) {
        // already running
        return;
      }
      startTime = performance.now();
      loop();
    }

    function loop() {
      const t = performance.now() - startTime;
      currentTime = t;
      onFrame?.(t);
      requestedFrameId = requestAnimationFrame(loop);
    }
  }
})();
