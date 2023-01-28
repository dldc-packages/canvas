export interface IScreduler {
  time(): number;
  start(): void;
  stop(): void;
}

export const Screduler = (() => {
  return { create };

  function create(onFrame: (t: number) => void): IScreduler {
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
