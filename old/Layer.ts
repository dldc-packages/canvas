import { clipRect, Rect } from '../Rect';
import { Scheduler } from '../Scheduler';
import { observable, IObservableValue } from 'mobx';
import { getViewportRect, convertDOMRectToRect } from '../Utils';

export type LayerConfig = {
  canvasEl: HTMLCanvasElement;
  render: (ctx: CanvasRenderingContext2D) => void;
  debug?: boolean;
};

export const INTERNAL = Symbol('LAYER_INTERNAL');

type Unmount = () => void;

export type Layer = {
  [INTERNAL]: {
    mount: (scheduler: Scheduler) => Unmount;
  };
};

type State = {
  canvasRect: IObservableValue<Rect>;
  visibleRect: IObservableValue<Rect | null>;
  devicePixelRatio: IObservableValue<number>;
};

export function Layer({ canvasEl }: LayerConfig): Layer {
  // let state = getState();
  // console.log(state);

  return { [INTERNAL]: { mount } };

  function mount(scheduler: Scheduler): Unmount {
    const unsub = scheduler.onUpdate(() => {
      // TODO
    });

    return () => {
      unsub();
    };
  }

  // function updateLayout() {
  //   const nextState = getState();
  // }

  // function getState(): State {
  //   const canvasRect = observable.box(convertDOMRectToRect(canvasEl.getBoundingClientRect()));
  //   const viewport = getViewportRect();
  //   const devicePixelRatio = window.devicePixelRatio;
  //   const visibleRect = clipRect(viewport, canvasRect);
  //   return { visibleRect, canvasRect, devicePixelRatio };
  // }
}
