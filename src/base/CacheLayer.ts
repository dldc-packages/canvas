import type { ILayer } from '../core/Layer.types';

export interface ICacheLayer<Child extends ILayer> extends ILayer {
  readonly children: Child;
}

export function CacheLayer<Child extends ILayer>(children: Child): ICacheLayer<Child> {
  return {
    children,
    mount() {
      return {};
    },
  };
}
