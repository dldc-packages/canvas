import { ILayer, Layer, OnRectParams, OnRectResult, OnRenderParams } from './Layer';
import { toArray } from './utils';

export interface IGroup<Child extends ILayer> extends ILayer {
  readonly children: ReadonlyArray<Child>;
  appendChild(child: Child): void;
  removeChild(child: Child): void;
  hasChild(child: Child): boolean;
}

export interface GroupOptions<Child extends ILayer> {
  children?: ReadonlyArray<Child>;
}

export const Group = (() => {
  return { create };

  function create<Child extends ILayer>({ children: initialChildren }: GroupOptions<Child> = {}): IGroup<Child> {
    const children: Array<Child> = [...(initialChildren ?? [])];

    const layerGroup: IGroup<Child> = {
      ref: Layer.createRef({
        onRect,
        onRender,
      }),
      children,
      appendChild,
      removeChild,
      hasChild,
    };

    return layerGroup;

    function appendChild(child: Child) {
      children.push(child);
    }

    function removeChild(child: Child) {
      const index = children.indexOf(child);
      if (index !== -1) {
        children.splice(index, 1);
      }
    }

    function hasChild(child: Child) {
      return children.includes(child);
    }

    function onRect(params: OnRectParams): OnRectResult {
      return children
        .map((child) => {
          return toArray(Layer.unwrap(child.ref).onRect(params));
        })
        .flat();
    }

    function onRender(params: OnRenderParams): void {
      children.forEach((child) => {
        Layer.unwrap(child.ref).onRender(params);
      });
    }
  }
})();
