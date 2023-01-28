import * as miid from 'miid';
import { IScreduler } from './Scheduler';

export class Tools extends miid.Stack {
  static create(ctx: CanvasRenderingContext2D, scheduler: IScreduler): Tools {
    return new Tools().with(Tools.CtxKey.Provider(ctx), Tools.SchedulerKey.Provider(scheduler));
  }

  static CtxKey = miid.createKey<CanvasRenderingContext2D>({ name: 'Ctx' });
  static SchedulerKey = miid.createKey<IScreduler>({ name: 'Screduler' });

  public get ctx(): CanvasRenderingContext2D {
    return this.getOrFail(Tools.CtxKey.Consumer);
  }

  public time(): number {
    return this.getOrFail(Tools.SchedulerKey.Consumer).time();
  }

  private constructor(internal: miid.StackInternal<Tools> | null = null) {
    super(internal);
  }

  override with(...keys: Array<miid.KeyProvider<any>>): Tools {
    return miid.Stack.applyKeys<Tools>(this, keys, (internal) => new Tools(internal));
  }
}
