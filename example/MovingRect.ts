import { SpringSequence } from '@dldc/humpf';
import type { ILayer } from '../src/mod';
import { BoxLayer, HitResponder, Layer } from '../src/mod';
import { PaintRect } from './PaintRect';

export function MovingRect(color: string): ILayer {
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
