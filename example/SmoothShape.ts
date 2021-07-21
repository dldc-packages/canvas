import { Point, movePointToward, distance, Rect } from './Geometry';

export interface Step {
  point: Point;
  radius?: number;
  sharpness?: number;
}

export interface Options {
  radius?: number;
  sharpness?: number;
}

export function smoothStepsFromRect(rect: Rect): Array<Step> {
  const [x, y, width, height] = rect;
  return [
    { point: { x: x, y: y } },
    { point: { x: x + width, y: y } },
    { point: { x: x + width, y: y + height } },
    { point: { x: x, y: y + height } },
  ];
}

export function smoothShape(
  ctx: CanvasRenderingContext2D,
  steps: Array<Step>,
  options: Options = {}
) {
  const { radius: round = 10, sharpness = 0.75 } = options;
  const stepsResolved = steps.map((step, index) => {
    return {
      radius: round,
      sharpness,
      ...step,
    };
  });
  const controlPoints = stepsResolved.map((step, index) => {
    const nextStep = steps[(index + 1) % steps.length];
    const prevStep = steps[(steps.length + index - 1) % steps.length];
    const d1 = distance(step.point, prevStep.point);
    const d2 = distance(step.point, nextStep.point);
    const maxHalfDist = Math.min(d1, d2) / 2;
    const radius = Math.min(maxHalfDist, step.radius);
    const p1 = movePointToward(step.point, prevStep.point, radius);
    const c1 = movePointToward(p1, step.point, radius * step.sharpness);
    const p2 = movePointToward(step.point, nextStep.point, radius);
    const c2 = movePointToward(p2, step.point, radius * step.sharpness);
    return { p1, c1, p2, c2 };
  });
  ctx.beginPath();
  controlPoints.forEach(({ c1, c2, p1, p2 }, index) => {
    if (index === 0) {
      ctx.moveTo(p1.x, p1.y);
    } else {
      ctx.lineTo(p1.x, p1.y);
    }
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p2.x, p2.y);
  });
  ctx.closePath();
}
