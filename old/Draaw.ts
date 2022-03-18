import { Factory } from 'democrat';
import { EventsResponderItem } from './EventsResponder';
import { HitManager } from '../src/HitManager';
import { Renderable } from '../src/types';

interface Options {
  rootEl: HTMLElement;
  pixelRatio: number;
}

export type Layer<R extends Renderable> = {
  canvesEl?: HTMLCanvasElement | null;
  App: Factory<void, R>;
  debug?: boolean;
};

export function Draaw<R extends Renderable>(layers: Layer<R>, { rootEl, pixelRatio }: Options) {
  console.log({ layers, rootEl, pixelRatio });

  const hitManager = HitManager<EventsResponderItem>();
  console.log({ hitManager });
}
