import { Key, Staack, StaackCoreValue } from '@dldc/stack';
import { IScreduler } from './Scheduler';

export class Tools extends Staack {
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

  protected instantiate(staackCore: StaackCoreValue): this {
    return new Tools(staackCore) as any;
  }
}
