import type { ILayer } from '../src/mod';
import { Geometry } from '../src/mod';

export function RenderArea(): ILayer {
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
