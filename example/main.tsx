import { SpringSequence } from 'humpf';
import { Group, HitResponder, ILayer, ILayerLifecycles, Layer, Renderer } from '../src/mod';
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
    ref: Layer.createRef((): ILayerLifecycles => {
      const xSeq = SpringSequence.create({
        initial: { position: Math.random() * 1000, equilibrium: Math.random() * 1000 },
        defaultConfig: { positionPrecision: 0.1, velocityPrecision: 0.01 },
      });
      const y = Math.random() * 600;

      const timer = setInterval(() => {
        xSeq.insertAt(renderer.scheduler.time(), { equilibrium: Math.random() * 1000 });
      }, 4000);

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
          // hitItem.cleanup();
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
