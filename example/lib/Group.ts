import { DraawWheelEvent, PointerActiveEvent, PointerHoverEvent } from '../../src/EventsManager';
import { IRect } from './Geometry';
import { DrawParams, ILayer, ILayerLifecycles, Layer, UpdateParams } from './Layer';
import { List } from './List';
import { Tools } from './Tools';

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
    const children = List.create<Child>(initialChildren ?? []);
    const mountedChildren = new WeakMap<Child, ILayerLifecycles>();
    let mounted: Tools | null = null;

    const layerGroup: IGroup<Child> = {
      ref: Layer.createRef(mount),
      children: children.raw,
      appendChild,
      removeChild,
      hasChild,
    };

    return layerGroup;

    function mount(tools: Tools): Required<ILayerLifecycles> {
      if (mounted) {
        throw new Error('Group already mounted');
      }
      mounted = tools;
      children.forEachSafe((child) => {
        mountChild(child, tools);
      });

      return {
        update,
        draw,
        cleanup,
        hit,
        onActivePointer,
        onPointerHover,
        onWheel,
      };

      function onActivePointer(event: PointerActiveEvent) {
        children.forEachSafe((child) => {
          const lifecycles = mountedChildren.get(child);
          lifecycles?.onActivePointer?.(event);
        });
      }

      function onPointerHover(event: PointerHoverEvent) {
        children.forEachSafe((child) => {
          const lifecycles = mountedChildren.get(child);
          lifecycles?.onPointerHover?.(event);
        });
      }

      function onWheel(event: DraawWheelEvent) {
        children.forEachSafe((child) => {
          const lifecycles = mountedChildren.get(child);
          lifecycles?.onWheel?.(event);
        });
      }

      function hit(params: DrawParams) {
        children.forEachSafe((child) => {
          const lifecycles = mountedChildren.get(child);
          lifecycles?.hit?.(params);
        });
      }

      function cleanup() {
        mounted = null;
        children.forEachSafe((child) => {
          unmountChild(child);
        });
      }

      function update(params: UpdateParams): null | Array<IRect> {
        return children
          .mapSafe((child): Array<IRect> => {
            const lifecycles = mountedChildren.get(child);
            if (lifecycles) {
              return lifecycles.update?.(params) ?? [];
            }
            return [];
          })
          .flat();
      }

      function draw(params: DrawParams): void {
        children.forEachSafe((child) => {
          const lifecycles = mountedChildren.get(child);
          lifecycles?.draw?.(params);
        });
      }
    }

    function mountChild(child: Child, tools: Tools) {
      const lifecycles = Layer.mount(child.ref, tools);
      if (lifecycles) {
        mountedChildren.set(child, lifecycles);
      }
    }

    function unmountChild(child: Child) {
      const lifecycles = mountedChildren.get(child);
      if (lifecycles) {
        lifecycles.cleanup?.();
        mountedChildren.delete(child);
      }
    }

    function appendChild(child: Child) {
      children.push(child);
      if (mounted) {
        mountChild(child, mounted);
      }
    }

    function removeChild(child: Child) {
      const removed = children.remove(child);
      if (removed) {
        if (mounted) {
          unmountChild(child);
        }
      }
    }

    function hasChild(child: Child) {
      return children.has(child);
    }
  }
})();
