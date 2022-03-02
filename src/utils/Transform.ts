import { expectNever } from './Utils';

export type TransformItem =
  // | { type: 'rotate'; angle: number }
  { type: 'translate'; x: number; y: number } | { type: 'scale'; x: number; y: number };

export type Transform = ReadonlyArray<TransformItem>;

export class TransformBuilder {
  private constructor(public readonly transform: Transform) {}

  translate(x: number, y: number): TransformBuilder {
    return new TransformBuilder([...this.transform, { type: 'translate', x, y }]);
  }
  static translate(x: number, y: number): TransformBuilder {
    return new TransformBuilder([]).translate(x, y);
  }

  scale(x: number, y: number): TransformBuilder {
    return new TransformBuilder([...this.transform, { type: 'scale', x, y }]);
  }
  static scale(x: number, y: number): TransformBuilder {
    return new TransformBuilder([]).scale(x, y);
  }

  // rotate(angle: number): TransformBuilder {
  //   return new TransformBuilder([...this.transform, { type: 'rotate', angle }]);
  // }
  // static rotate(angle: number): TransformBuilder {
  //   return new TransformBuilder([]).rotate(angle);
  // }
}

export function inverseTransform(transform: Transform): Transform {
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
