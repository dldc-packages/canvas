import type { TKey, TStackCoreValue } from "@dldc/stack";
import { createKey, Stack } from "@dldc/stack";
import type { IFrame } from "./Frame.ts";
import type { IScheduler } from "./Scheduler.ts";

export class Tools extends Stack {
  static create(view: IFrame, scheduler: IScheduler): Tools {
    return new Tools().with(
      Tools.FrameKey.Provider(view),
      Tools.CtxKey.Provider(view.context),
      Tools.SchedulerKey.Provider(scheduler),
    );
  }

  static CtxKey: TKey<CanvasRenderingContext2D> = createKey<
    CanvasRenderingContext2D
  >("Ctx");
  static SchedulerKey: TKey<IScheduler> = createKey<IScheduler>("Screduler");
  static FrameKey: TKey<IFrame> = createKey<IFrame>("View");

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
