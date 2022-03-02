import { RootScheduler, EventsManager, Canvas } from '../src';
import { ChildScheduler } from '../src/Scheduler';
import { TransformBuilder } from '../src/utils/Transform';
import { smoothShape, smoothStepsFromRect } from './SmoothShape';

const rootEl = document.getElementById('root')!;

const evm = new EventsManager(window);

// ==========================

const rootScheduler = new RootScheduler();

const mainBox = document.createElement('div');
mainBox.style.position = 'fixed';
mainBox.style.inset = '0';
rootEl.appendChild(mainBox);
const mainCanvas = new Canvas();
mainCanvas.syncWithElement(mainBox, rootScheduler);

rootScheduler.onUpdate(() => {
  // rootScheduler.requestFrameRender(mainCanvas.view);
});

rootScheduler.onRender(({ rects }) => {
  // mainCanvas.context.fillStyle = 'blue';
  rects.forEach(([x, y, w, h]) => {
    mainCanvas.context.clearRect(x, y, w, h);
    mainCanvas.context.beginPath();
    mainCanvas.context.rect(x + 10, y + 10, w - 20, h - 20);
    mainCanvas.context.closePath();
    mainCanvas.context.lineWidth = 1;
    mainCanvas.context.strokeStyle = 'blue';
    mainCanvas.context.stroke();
    // mainCanvas.context.drawImage(offscreenCanvas.element, )
  });
});

const offscreenScheduler = new ChildScheduler(TransformBuilder.translate(100, 100).transform);
rootScheduler.addChild(offscreenScheduler);

const offscreenCanvas = new Canvas({
  rect: [100, 100, 200, 200],
  pixelRatio: mainCanvas.pixelRatio,
});

offscreenScheduler.onUpdate(() => {
  offscreenScheduler.requestFrameRender(offscreenCanvas.view);
});

offscreenScheduler.onRender(({ t, rects }) => {
  offscreenCanvas.context.fillStyle = 'red';
  const x = Math.sin(t / 1000) * 100;
  offscreenCanvas.context.fillRect(x, 0, 50, 50);
});

// const sch2 = new ChildScheduler();
// rootScheduler.addChild(sch2);

// rootScheduler.requestFrameRender(mainCanvas.view);
// sch1.requestFrameRender([0, 0, 100, 100]);

// mainScheduler.onUpdate(() => {
//   mainScheduler.requestFrameRender([0, 0, 200, 200]);
// });

// mainScheduler.onRender(({ rects }) => {
//   mainCanvas.context.fillStyle = 'rgba(255, 255, 255, 1)';
//   rects.forEach(([x, y, w, h]) => {
//     mainCanvas.context.clearRect(x, y, w, h);
//     mainCanvas.context.beginPath();
//     mainCanvas.context.rect(x + 10, y + 10, w - 20, h - 20);
//     mainCanvas.context.closePath();
//     mainCanvas.context.lineWidth = 1;
//     mainCanvas.context.strokeStyle = 'red';
//     mainCanvas.context.fill();

//     // const padding = 10;
//     // const size = Math.min(w - padding * 2, h - padding * 2);
//     // smoothShape(
//     //   mainCanvas.context,
//     //   smoothStepsFromRect([x + padding, y + padding, w - padding * 2, h - padding * 2]),
//     //   {
//     //     radius: size / 4,
//     //   }
//     // );
//     // mainCanvas.context.fill();
//   });
// });

// rootScheduler.requestFrameRender(mainCanvas.view);

// ============

// const canvas = document.createElement('canvas');
// canvas.width = width;
// canvas.height = height;
// canvas.style.position = 'fixed';
// canvas.style.left = '0px';
// canvas.style.top = '0px';
// canvas.style.right = '0px';
// canvas.style.bottom = '0px';

// rootEl.appendChild(canvas);

// const ctx = canvas.getContext('2d')!;

// const rects: Array<Rect> = [];

// // addRect();
// // addRect();
// // addRect();
// render();

// function render() {
//   ctx.clearRect(0, 0, width, height);

//   ctx.fillStyle = 'rgba(0, 0, 255, 1)';
//   rects.forEach(([x, y, w, h]) => {
//     ctx.fillRect(x, y, w, h);
//   });

//   const a = performance.now();
//   const merged = mergeIntersectingRects(rects);
//   const b = performance.now();
//   console.log(b - a + 'ms');

//   merged.forEach(([x, y, w, h]) => {
//     const color = 'red'; // `hsl(${360 * Math.random()}, 100%, 30%)`;
//     ctx.strokeStyle = color;
//     ctx.fillStyle = color;
//     ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
//     // ctx.fillRect(x, y, w, h);
//   });
// }

// function addRect() {
//   const w = Math.floor(Math.random() * width * 0.5);
//   const h = Math.floor(Math.random() * height * 0.5);
//   const x = Math.floor((width - w) * Math.random());
//   const y = Math.floor((height - h) * Math.random());
//   rects.push([x, y, w, h]);
// }

// canvas.addEventListener('click', () => {
//   addRect();
//   render();
// });

// =====================

// const canvas = document.createElement('canvas');
// canvas.style.width = '90vw';
// canvas.style.height = '300px';
// // canvas.style.background = 'red';
// canvas.addEventListener('click', () => {
//   canvas.style.height = '400px';
// });
// rootEl.appendChild(canvas);

// const view = new CanvasView(canvas, scheduler);

// autorun(r => {
//   if (view.relativeVisibleRectScaled) {
//     scheduler.requestFrameRender(view.relativeVisibleRectScaled);
//   }
// });

// const ctx = box.getContext('2d')!;

// scheduler.onRender(({ rects }) => {
//   ctx.strokeStyle = 'blue';
//   rects.forEach(([x, y, w, h]) => {
//     ctx.strokeRect(x + 1, y + 1, w - 1, h - 1);
//   });
//   console.log('render', ...rects);
// });

// const em = EventsManager(window, {
//   onActivePointer(event) {
//     const tracker = event.track({
//       onPointerMove: e => {
//         console.log('A', e.x, e.y);
//       }
//     });

//     const tracker2 = event.track({
//       onPointerMove: e => {
//         console.log('B', e.x, e.y);
//       }
//     });
//   }
// });

// Draaw(
//   { },
//   {
//     rootEl: document.body,
//     pixelRatio: 1
//   }
// );

// const sch = new RootScheduler();

// sch.onUpdate(({ t }) => {
//   if (t < 2000) {
//     sch.requestFrameRender([0, 0, 100, 100]);
//   }
// });
// sch.onUpdate(({ t }) => {
//   if (t < 3000) {
//     sch.requestFrameRender([100, 100, 200, 200]);
//   }
// });

// function convertBoundingClientRectToReact(rect: DOMRect): Rect {
//   return [rect.x, rect.y, rect.width, rect.height];
// }

// function getViewportRect(): Rect {
//   return [0, 0, window.innerWidth, window.innerHeight];
// }

// let canvasRect: Rect = convertBoundingClientRectToReact(canvas.getBoundingClientRect());
// sch.onUpdate(({ t }) => {
//   const rect = convertBoundingClientRectToReact(canvas.getBoundingClientRect());
//   if (rectsEqual(rect, canvasRect) === false) {
//     canvasRect = rect;
//     sch.requestFrameRender(canvasRect);
//   }
// });

// sch.onRender(({ t, rects }) => {
//   console.log('render', t, ...rects);
// });

// console.log(clipRect([0, 0, 100, 100], [99, 99, 100, 100]));
