import type { IHitResponder, ILayer } from '@mod';
import { Variable } from '@mod';

export interface IPaintRect extends ILayer {
  color: string;
}

export function PaintRect(hit: IHitResponder, color: string): IPaintRect {
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
