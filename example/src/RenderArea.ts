import type { ILayer } from '@mod';
import { expandRect } from '@mod';

export function RenderArea(): ILayer {
  return {
    mount: () => {
      return {
        draw({ ctx, view }) {
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 2;
          const [x, y, width, height] = expandRect(view, -1);
          ctx.strokeRect(x, y, width, height);
        },
      };
    },
  };
}
