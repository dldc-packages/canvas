import { SpringSequence } from 'humpf';
import { Group, ILayer, ILayerLifecycles, Layer, Renderer } from './lib/mod';
import { Variable } from './lib/Variable';

const rootEl = document.getElementById('root')!;

const target = document.createElement('div');
Object.assign(target.style, { position: 'fixed', inset: '50px' });
rootEl.appendChild(target);

const renderer = Renderer.create({
  target,
  layer: Group.create({ children: [Clear(), Rect()] }),
});

function Clear(): ILayer {
  return {
    ref: Layer.createRef((tools): ILayerLifecycles => {
      return {
        draw({ rect }) {
          tools.ctx.clearRect(...rect);
        },
      };
    }),
  };
}

function Rect(): ILayer {
  return {
    ref: Layer.createRef((tools): ILayerLifecycles => {
      const xSeq = SpringSequence.create({ initial: { position: 0, equilibrium: 1000 } });
      const y = Math.random() * window.innerHeight;

      const timer = setInterval(() => {
        xSeq.insertAt(renderer.scheduler.getTime(), { equilibrium: Math.random() * 1000 });
      }, 4000);

      const isHovered = Variable.create(false);

      // TODO
      const hitItem = tools.createHit();

      hitItem.onPointerEnter(() => {
        isHovered.value = true;
      });

      hitItem.onPointerLeave(() => {
        isHovered.value = false;
      });

      let x = 0;

      return {
        cleanup() {
          clearInterval(timer);
          hitItem.cleanup();
        },
        update({ view, t }) {
          x = xSeq.spring.position(t);
          if (xSeq.spring.stable(t) && !isHovered.commit()) {
            return null;
          }
          return [view];
        },
        draw({ ctx }) {
          ctx.fillStyle = 'red';
          ctx.fillRect(x, y, 100, 100);
        },
        hit({ t, rect, ctx }) {
          ctx.fillStyle = hitItem.color;
          ctx.fillRect(x, y, 100, 100);
        },
        onPointerHover({ pointers }) {
          // const x = xSeq.spring.position(t);
          // isHovered.value = pointers.some((p) => p.x);
        },
      };
    }),
  };
}
