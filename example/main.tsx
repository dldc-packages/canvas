import { SpringSequence } from '@dldc/humpf';
import type { ILayer, ILayerLifecycles } from '../src/mod';
import { Group, HitResponder, Layer, Renderer } from '../src/mod';
import { Variable } from './Variable';

const rootEl = document.getElementById('root')!;

const target = document.createElement('div');
Object.assign(target.style, { position: 'fixed', inset: '50px' });
rootEl.appendChild(target);

const renderer = Renderer.create({
  target,
  layer: Group.create({
    children: [
      Clear(),
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
});

console.log(renderer);

function Clear(): ILayer {
  return {
    ref: Layer.createRef((): ILayerLifecycles => {
      return {
        draw({ rect, ctx }) {
          ctx.clearRect(...rect);
        },
      };
    }),
  };
}

function Rect(color: string): ILayer {
  return {
    ref: Layer.createRef((tools): ILayerLifecycles => {
      const xSeq = SpringSequence.create({
        initial: { position: Math.random() * 1000, equilibrium: Math.random() * 1000 },
        defaultConfig: { positionPrecision: 0.1, velocityPrecision: 0.01 },
      });
      const y = Math.random() * 600;

      const timer = setInterval(
        () => {
          xSeq.insertAt(tools.time(), { equilibrium: Math.random() * 1000 });
        },
        2000 + 2000 * Math.random(),
      );

      const isHovered = Variable.create(false);

      const hit = HitResponder.create();

      hit.onPointerEnter(() => {
        isHovered.value = true;
      });

      hit.onPointerLeave(() => {
        isHovered.value = false;
      });

      const width = 300;
      const height = 300;
      let x = 0;

      return Layer.merge(hit, {
        cleanup() {
          clearInterval(timer);
        },
        update({ view, t }) {
          x = xSeq.spring.position(t);
          if (xSeq.spring.stable(t) && !isHovered.commit()) {
            return null;
          }
          return [view];
        },
        draw({ ctx }) {
          hit.setDraw(({ ctx }) => {
            ctx.fillRect(x, y, width, height);
          });
          ctx.fillStyle = isHovered.value ? 'red' : color;
          ctx.fillRect(x, y, width, height);
        },
      });
    }),
  };
}
