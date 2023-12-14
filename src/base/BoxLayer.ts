import type { ILayer } from '../core/Layer.types';
import type { IRect } from '../mod';
import { Variables } from './Variables';

/**
 *
 */
export interface IBoxLayer<Child extends ILayer> extends ILayer {
  readonly children: Child;
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface IBoxLayerOptions<Child extends ILayer> {
  children: Child;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

export function BoxLayer<Child extends ILayer>({
  children,
  x = 0,
  y = 0,
  height = 100,
  width = 100,
}: IBoxLayerOptions<Child>): IBoxLayer<Child> {
  const $coords = Variables({ x, y, width, height });

  return {
    children,

    get x() {
      return $coords.get('x');
    },
    set x(value) {
      $coords.set('x', value);
    },
    get y() {
      return $coords.get('y');
    },
    set y(value) {
      $coords.set('y', value);
    },
    get width() {
      return $coords.get('width');
    },
    set width(value) {
      $coords.set('width', value);
    },
    get height() {
      return $coords.get('height');
    },
    set height(value) {
      $coords.set('height', value);
    },

    mount(tools) {
      const childLifecycles = children.mount(tools);

      return {
        ...childLifecycles,
        update: ({ view, t }) => {
          const changed = $coords.commit();
          const subView: IRect = [$coords.get('x'), $coords.get('y'), $coords.get('width'), $coords.get('height')];
          const childRects = childLifecycles.update?.({ view: subView, t }) ?? null;
          return changed ? [view, ...(childRects ?? [])] : childRects;
        },
        draw({ view, ...rest }) {
          const subView: IRect = [$coords.get('x'), $coords.get('y'), $coords.get('width'), $coords.get('height')];
          childLifecycles.draw?.({ ...rest, view: subView });
        },
      };
    },
  };
}
