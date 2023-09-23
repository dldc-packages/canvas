import type { TStackCoreValue } from '@dldc/stack';
import { Key, Stack } from '@dldc/stack';
import type { IScreduler } from './Scheduler';

export class Tools extends Stack {
  static create(ctx: CanvasRenderingContext2D, scheduler: IScreduler): Tools {
    return new Tools().with(Tools.CtxKey.Provider(ctx), Tools.SchedulerKey.Provider(scheduler));
  }

  static CtxKey = Key.create<CanvasRenderingContext2D>('Ctx');
  static SchedulerKey = Key.create<IScreduler>('Screduler');

  public get ctx(): CanvasRenderingContext2D {
    return this.getOrFail(Tools.CtxKey.Consumer);
  }

  public time(): number {
    return this.getOrFail(Tools.SchedulerKey.Consumer).time();
  }

  protected instantiate(stackCore: TStackCoreValue): this {
    return new Tools(stackCore) as any;
  }
}
