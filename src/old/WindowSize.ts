import { throttle, Size } from '../Utils';
import { OnUnsubscribed, Subscription, SubscriptionCallback, Unsubscribe } from 'suub';

export class WindowSize {
  private static _instance: WindowSize | null = null;

  static get instance(): WindowSize {
    if (WindowSize._instance) {
      return WindowSize._instance;
    }
    const instance = new WindowSize();
    WindowSize._instance = instance;
    return instance;
  }

  static get(): Size {
    return WindowSize.instance.get();
  }

  static subscribe(
    callback: SubscriptionCallback<Size>,
    onUnsubscribe?: OnUnsubscribed
  ): Unsubscribe {
    return WindowSize.instance.subscribe(callback, onUnsubscribe);
  }

  private size: Size;
  private sub = Subscription<Size>();
  private scale: number = 1;

  private constructor() {
    this.size = {
      width: window.innerWidth * this.scale,
      height: window.innerHeight * this.scale,
    };

    window.addEventListener(
      'resize',
      throttle(() => {
        this.onResize();
      }, 1000 / 60)
    );
  }

  get(): Size {
    return this.size;
  }

  subscribe = this.sub.subscribe;

  private onResize() {
    this.size = {
      width: window.innerWidth * this.scale,
      height: window.innerHeight * this.scale,
    };
    this.sub.emit(this.size);
  }
}
