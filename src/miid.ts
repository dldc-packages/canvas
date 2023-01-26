import * as miid from 'miid';

export type Render = () => void;

export type Middleware = miid.Middleware<DraawContext, Render, Render>;
export type Middlewares = miid.Middlewares<DraawContext, Render, Render>;
export type Next = miid.Next<DraawContext, Render>;

export class DraawContext extends miid.Stack {
  static create(): DraawContext {
    return new DraawContext();
  }

  private constructor(internal: miid.StackInternal<DraawContext> | null = null) {
    super(internal);
  }

  override with(...keys: Array<miid.KeyProvider<any>>): DraawContext {
    return miid.Stack.applyKeys<DraawContext>(this, keys, (internal) => new DraawContext(internal));
  }
}

const mid: Middleware = (ctx, next) => {
  return () => {};
};
