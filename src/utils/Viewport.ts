import { makeAutoObservable } from 'mobx';
import { Rect } from './Rect';

interface Internal {
  width: number;
  height: number;
  onResize: () => void;
  rect: Rect;
}

// Observable Singleton to get the size of the viewport
// Usage: const viewport = Wiewport.instance;
export class Viewport {
  private static _instance: Viewport | null = null;

  public static get instance(): Viewport {
    if (Viewport._instance === null) {
      Viewport._instance = Viewport.create();
    }
    return Viewport._instance;
  }

  private static create(): Viewport {
    const internal = makeAutoObservable<Internal>({
      width: window.innerWidth,
      height: window.innerHeight,
      onResize() {
        internal.width = window.innerWidth;
        internal.height = window.innerHeight;
      },
      get rect(): Rect {
        return [0, 0, internal.width, internal.height];
      },
    });
    window.addEventListener('resize', () => {
      internal.onResize();
    });
    return new Viewport(internal);
  }

  private constructor(private internal: Internal) {
    makeAutoObservable(this);
  }

  public get rect(): Rect {
    return this.internal.rect;
  }

  public get width() {
    return this.internal.width;
  }

  public get height() {
    return this.internal.height;
  }
}
