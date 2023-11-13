import type { ILayer } from '../core/Layer.types';
import { Geometry } from '../mod';

/**
 * Apply pixelRation to canvas scale and view
 */
export function PixelRatio(child: ILayer): ILayer {
  return {
    mount: (tools) => {
      const childLifecycles = child.mount(tools);
      const frame = tools.frame;

      return {
        ...childLifecycles,
        update({ view, t }) {
          return childLifecycles.update?.({ view: Geometry.Rect.scale(view, 1 / frame.pixelRatio), t }) ?? null;
        },
        draw({ ctx, view, ...rest }) {
          ctx.save();
          ctx.scale(frame.pixelRatio, frame.pixelRatio);
          childLifecycles.draw?.({ ...rest, ctx, view: Geometry.Rect.scale(view, 1 / frame.pixelRatio) });
          ctx.restore();
        },
      };
    },
  };
}
