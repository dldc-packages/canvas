import { SpringSequence } from '@dldc/humpf';
import type { IHitResponder, ILayer } from '../src/mod';
import { BoxLayer, Geometry, Group, HitResponder, Layer, PixelRatio, Renderer, Variable } from '../src/mod';

const rootEl = document.getElementById('root')!;
const target = document.createElement('div');
Object.assign(target.style, { position: 'fixed', inset: '50px' });
rootEl.appendChild(target);

const renderer = Renderer.create({
  target,
  layer: PixelRatio(
    Group.create({
      children: [
        Clear(),
        RenderArea(),
        Rect('#000000'),
        Rect('#222222'),
        Rect('#444444'),
        Rect('#666666'),
        Rect('#888888'),
        Rect('#aaaaaa'),
        Rect('#cccccc'),
        Rect('#eeeeee'),
      ],
    }),
  ),
});

console.log(renderer);

setTimeout(() => {
  console.log(renderer.view.view);
}, 5000);

function Clear(): ILayer {
  return {
    mount: () => {
      return {
        draw({ rect, ctx }) {
          ctx.clearRect(...rect);
        },
      };
    },
  };
}

function RenderArea(): ILayer {
  return {
    mount: () => {
      return {
        draw({ ctx, view }) {
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 2;
          const [x, y, width, height] = Geometry.Rect.expand(view, -1);
          ctx.strokeRect(x, y, width, height);
        },
      };
    },
  };
}

function Rect(color: string): ILayer {
  const hit = HitResponder.create();

  const paintRect = PaintRect(hit, color);
  const boxLayer = BoxLayer({ children: paintRect, width: 300, height: 300, x: 0, y: Math.random() * 600 });

  return {
    mount: (tools) => {
      const boxMounted = boxLayer.mount(tools);

      const xSeq = SpringSequence.create({
        initial: { position: Math.random() * 1000, equilibrium: Math.random() * 1000 },
        defaultConfig: { positionPrecision: 0.1, velocityPrecision: 0.01 },
      });

      const timer = setInterval(
        () => {
          xSeq.insertAt(tools.time(), { equilibrium: Math.random() * 1000 });
        },
        2000 + 2000 * Math.random(),
      );

      hit.onPointerEnter(() => {
        paintRect.color = 'blue';
      });

      hit.onPointerLeave(() => {
        paintRect.color = color;
      });

      return Layer.merge(hit, boxMounted, {
        cleanup() {
          clearInterval(timer);
        },
        update({ t }) {
          boxLayer.x = xSeq.spring.position(t);
          return null;
        },
      });
    },
  };
}

interface IPaintRect extends ILayer {
  color: string;
}

function PaintRect(hit: IHitResponder, color: string): IPaintRect {
  const $color = Variable(color);

  return {
    get color() {
      return $color.value;
    },
    set color(value: string) {
      $color.value = value;
    },

    mount() {
      return {
        update({ view }) {
          const colorChanged = $color.commit();
          return colorChanged ? [view] : null;
        },
        draw: ({ ctx, view }) => {
          hit.setDraw(({ ctx }) => {
            ctx.fillRect(x, y, width, height);
          });
          ctx.fillStyle = $color.value;
          const [x, y, width, height] = view;
          ctx.fillRect(x, y, width, height);
        },
      };
    },
  };
}
