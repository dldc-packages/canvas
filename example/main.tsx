import { autorun } from 'mobx';
import { ScreenCanvas, RootScheduler, EventsManager, Canvas } from '../src';
import { ChildScheduler } from '../src/Scheduler';

const rootEl = document.getElementById('root')!;

const evm = new EventsManager(window);

const width = window.innerWidth;
const height = window.innerHeight;

// ==========================

const scheduler = new RootScheduler();

rootEl.style.height = '4000px';
rootEl.style.width = '2000px';

function createBox() {
  const box = document.createElement('div');
  box.style.position = 'relative';
  box.style.width = '20vw';
  box.style.height = '300px';
  box.style.background = 'blue';
  return box;
}

// TODO: Use OffscreenCanvas

const box1 = createBox();
rootEl.appendChild(box1);
const view1 = new ScreenCanvas(box1);
const sch1 = new ChildScheduler();
scheduler.addChild(sch1);
sch1.onUpdate(view1.update);

const off = new Canvas({
  rect: [0, 0, 200, 200],
  viewport: null,
  pixelRatio: view1.canvas.pixelRatio,
});
const sch2 = new ChildScheduler();
sch1.addChild(sch2);

// const box2 = createBox();
// rootEl.appendChild(off.element);
// const view2 = new ScreenCanvas(box2);
// const sch2 = new ChildScheduler();
// scheduler.addChild(sch2);
// sch2.onUpdate(view2.update);

document.body.addEventListener('click', updateCanvas);

// autorun(() => {
//   const visible = view1.viewVisible;
//   if (visible) {
//     sch1.requestFrameRender(visible);
//   }
// });

// autorun(() => {
//   const visible = view2.viewVisible;
//   if (visible) {
//     sch2.requestFrameRender(visible);
//   }
// });

sch2.onUpdate(() => {
  if (off.viewVisible) {
    sch2.requestFrameRender(off.viewVisible);
  }
});

sch1.onUpdate(() => {
  if (view1.canvas.viewVisible) {
    sch1.requestFrameRender(view1.canvas.viewVisible);
  }
});

sch2.onRender(({ rects, t }) => {
  off.context.fillStyle = 'red';
  rects.forEach(([x, y, w, h]) => {
    off.context.clearRect(x, y, w, h);
    const redX = Math.sin(t / 1000) * 200;
    off.context.fillRect(redX, y, w, h);
  });
});

sch1.onRender(({ rects }) => {
  view1.canvas.context.fillStyle = 'rgba(255, 255, 255, 1)';
  rects.forEach(([x, y, w, h]) => {
    view1.canvas.context.clearRect(x, y, w, h);
    view1.canvas.context.fillRect(x + 10, y + 10, w - 20, h - 20);
    view1.canvas.context.drawImage(off.element, 0, 0);
  });
});

// sch2.onRender(({ rects }) => {
//   view2.context.fillStyle = 'rgba(255, 255, 255, 1)';
//   rects.forEach(([x, y, w, h]) => {
//     view2.context.clearRect(x, y, w, h);
//     view2.context.fillRect(x + 10, y + 10, w - 20, h - 20);
//   });
// });

function updateCanvas() {
  box1.style.width = 100 + Math.random() * 400 + 'px';
  box1.style.height = 100 + Math.random() * 400 + 'px';
  box1.style.left = Math.random() * 200 + 'px';
  box1.style.top = Math.random() * 200 + 'px';

  // box2.style.width = 100 + Math.random() * 400 + 'px';
  // box2.style.height = 100 + Math.random() * 400 + 'px';
  // box2.style.left = Math.random() * 200 + 'px';
  // box2.style.top = Math.random() * 200 + 'px';
}

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
