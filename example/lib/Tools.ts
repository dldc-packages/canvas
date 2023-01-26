import * as miid from 'miid';

export class Tools extends miid.Stack {
  static create(ctx: CanvasRenderingContext2D): Tools {
    return new Tools().with(Tools.CtxKey.Provider(ctx));
  }

  static CtxKey = miid.createKey<CanvasRenderingContext2D>({ name: 'Ctx' });

  public get ctx(): CanvasRenderingContext2D {
    return this.getOrFail(Tools.CtxKey.Consumer);
  }

  private constructor(internal: miid.StackInternal<Tools> | null = null) {
    super(internal);
  }

  override with(...keys: Array<miid.KeyProvider<any>>): Tools {
    return miid.Stack.applyKeys<Tools>(this, keys, (internal) => new Tools(internal));
  }
}
