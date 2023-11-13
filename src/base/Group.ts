import { Layer } from '../core/Layer';
import type { ILayer, ILayerLifecycles } from '../core/Layer.types';
import type { Tools } from '../Tools';
import { List } from '../utils/List';

export interface IGroup<Child extends ILayer> extends ILayer {
  readonly children: ReadonlyArray<Child>;
  appendChild(child: Child): void;
  removeChild(child: Child): void;
  hasChild(child: Child): boolean;
}

export interface IGroupOptions<Child extends ILayer> {
  children?: ReadonlyArray<Child>;
}

export const Group = (() => {
  return { create };

  function create<Child extends ILayer>({ children: initialChildren }: IGroupOptions<Child> = {}): IGroup<Child> {
    const children = List.create<Child>(initialChildren ?? []);
    const mountedChildren = new WeakMap<Child, ILayerLifecycles>();
    let mounted: Tools | null = null;

    let mergedLifecycles: ILayerLifecycles = {};

    const layerGroup: IGroup<Child> = {
      mount,
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
      updateMergeLifecycles();

      return {
        pointers: (pointers) => mergedLifecycles.pointers?.(pointers) ?? pointers,
        event: (event) => mergedLifecycles.event?.(event) ?? false,

        update: (params) => mergedLifecycles.update?.(params) ?? null,
        draw: (params) => mergedLifecycles.draw?.(params),
        cleanup: () => mergedLifecycles.cleanup?.(),
      };
    }

    function updateMergeLifecycles() {
      mergedLifecycles = Layer.merge(...children.mapSafe((child) => mountedChildren.get(child) ?? {}));
    }

    function mountChild(child: Child, tools: Tools) {
      const lifecycles = child.mount(tools);
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
      updateMergeLifecycles();
    }

    function removeChild(child: Child) {
      const removed = children.remove(child);
      if (removed) {
        if (mounted) {
          unmountChild(child);
        }
        updateMergeLifecycles();
      }
    }

    function hasChild(child: Child) {
      return children.has(child);
    }
  }
})();
