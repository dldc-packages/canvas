import { expectNever } from './Utils';

export type TransformItem =
  // | { type: 'rotate'; angle: number }
  { type: 'translate'; x: number; y: number } | { type: 'scale'; x: number; y: number };

export type ITransform = ReadonlyArray<TransformItem>;

export interface ITransformBuilder {
  readonly transform: ITransform;
  readonly inverse: ITransform;
  translate(x: number, y: number): ITransformBuilder;
  scale(x: number, y: number): ITransformBuilder;
}

export const Transform = (() => {
  return {
    builder: {
      translate,
      scale,
      create: createBuilder,
    },
    inverse,
  };

  function translate(x: number, y: number): ITransformBuilder {
    return createBuilder([]).translate(x, y);
  }

  function scale(x: number, y: number): ITransformBuilder {
    return createBuilder([]).scale(x, y);
  }

  function inverse(transform: ITransform): ITransform {
    return transform
      .map((step): TransformItem => {
        if (step.type === 'translate') {
          return { type: 'translate', x: -step.x, y: -step.y };
        }
        // if (step.type === 'rotate') {
        //   return { type: 'rotate', angle: -step.angle };
        // }
        if (step.type === 'scale') {
          return { type: 'scale', x: 1 / step.x, y: 1 / step.y };
        }
        return expectNever(step);
      })
      .reverse();
  }

  function createBuilder(transform: ITransform): ITransformBuilder {
    let inverseTransform: ITransform | null = null;

    return {
      transform,
      translate,
      scale,
      get inverse() {
        if (inverseTransform === null) {
          inverseTransform = inverse(transform);
        }
        return inverseTransform;
      },
    };

    function translate(x: number, y: number): ITransformBuilder {
      return createBuilder([...transform, { type: 'translate', x, y }]);
    }

    function scale(x: number, y: number): ITransformBuilder {
      return createBuilder([...transform, { type: 'scale', x, y }]);
    }
  }
})();
