import type { ILayer } from '@mod';

export function Clear(): ILayer {
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
