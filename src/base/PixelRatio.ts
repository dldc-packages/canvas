import type { ILayer } from "../core/Layer.types.ts";
import { scaleRect } from "../utils/Geometry.ts";

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
          return childLifecycles.update?.({
            view: scaleRect(view, 1 / frame.pixelRatio),
            t,
          }) ?? null;
        },
        draw({ ctx, view, ...rest }) {
          ctx.save();
          ctx.scale(frame.pixelRatio, frame.pixelRatio);
          childLifecycles.draw?.({
            ...rest,
            ctx,
            view: scaleRect(view, 1 / frame.pixelRatio),
          });
          ctx.restore();
        },
      };
    },
  };
}
