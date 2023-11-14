import type { TStackCoreValue } from '@dldc/stack';
import { Key, Stack } from '@dldc/stack';
import type { IFrame } from '../mod';
import type { IScheduler } from './Scheduler';

export class Tools extends Stack {
  static create(view: IFrame, scheduler: IScheduler): Tools {
    return new Tools().with(
      Tools.FrameKey.Provider(view),
      Tools.CtxKey.Provider(view.context),
      Tools.SchedulerKey.Provider(scheduler),
    );
  }

  static CtxKey = Key.create<CanvasRenderingContext2D>('Ctx');
  static SchedulerKey = Key.create<IScheduler>('Screduler');
  static FrameKey = Key.create<IFrame>('View');

  public get ctx(): CanvasRenderingContext2D {
    return this.getOrFail(Tools.CtxKey.Consumer);
  }

  public get frame(): IFrame {
    return this.getOrFail(Tools.FrameKey.Consumer);
  }

  public time(): number {
    return this.getOrFail(Tools.SchedulerKey.Consumer).time();
  }

  protected instantiate(stackCore: TStackCoreValue): this {
    return new Tools(stackCore) as any;
  }
}
