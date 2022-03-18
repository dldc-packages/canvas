import { ChildScheduler, RootScheduler } from '../src/Scheduler';
import { TransformBuilder } from '../src/utils/Transform';

test('Create scheduler', () => {
  const root = new RootScheduler({ autoStart: false });
  const onUpdate = jest.fn();
  root.onUpdate(onUpdate);
  (root as any).onFrame();
  expect(onUpdate).toHaveBeenCalled();
});

test('Schedule rect', () => {
  const root = new RootScheduler({ autoStart: false });
  const onRender = jest.fn();
  root.onRender(onRender);
  root.requestFrameRender([50, 50, 100, 100]);
  (root as any).onFrame();
  expect(onRender).toHaveBeenCalled();
  expect(onRender.mock.calls[0][0].rects).toEqual([[50, 50, 100, 100]]);
});

test('Child scheduler', () => {
  const root = new RootScheduler({ autoStart: false });

  root.requestFrameRender([50, 50, 100, 100]);
  const child = new ChildScheduler();
  root.addChild(child);
  // Cannot add root to child
  expect(() => child.addChild(root)).toThrow();
  // cannot add child to self
  expect(() => child.addChild(child)).toThrow();

  const onRootRender = jest.fn();
  root.onRender(onRootRender);

  const onChildRender = jest.fn();
  child.onRender(onChildRender);

  // trigger frame
  (root as any).onFrame();
  expect(onRootRender).toHaveBeenCalled();
  expect(onRootRender.mock.calls[0][0].rects).toEqual([[50, 50, 100, 100]]);
  expect(onChildRender).toHaveBeenCalled();
  expect(onChildRender.mock.calls[0][0].rects).toEqual([[50, 50, 100, 100]]);

  onRootRender.mockClear();
  onChildRender.mockClear();

  child.requestFrameRender([75, 75, 80, 80]);
  (root as any).onFrame();
  expect(onRootRender).toHaveBeenCalled();
  expect(onRootRender.mock.calls[0][0].rects).toEqual([[75, 75, 80, 80]]);
  expect(onChildRender).toHaveBeenCalled();
  expect(onChildRender.mock.calls[0][0].rects).toEqual([[75, 75, 80, 80]]);
});

test('Child scheduler with transform', () => {
  const root = new RootScheduler({ autoStart: false });

  root.requestFrameRender([50, 50, 100, 100]);
  const child = new ChildScheduler(TransformBuilder.translate(200, 200).scale(0.5, 0.5).transform);
  root.addChild(child);
  // Cannot add root to child
  expect(() => child.addChild(root)).toThrow();
  // cannot add child to self
  expect(() => child.addChild(child)).toThrow();

  const onRootRender = jest.fn();
  root.onRender(onRootRender);

  const onChildRender = jest.fn();
  child.onRender(onChildRender);

  // trigger frame
  (root as any).onFrame();
  expect(onRootRender).toHaveBeenCalled();
  expect(onRootRender.mock.calls[0][0].rects).toEqual([[50, 50, 100, 100]]);
  expect(onChildRender).toHaveBeenCalled();
  expect(onChildRender.mock.calls[0][0].rects).toEqual([[250, 250, 50, 50]]);
});

test('Child scheduler with transform (render from child', () => {
  const root = new RootScheduler({ autoStart: false });

  const child = new ChildScheduler(TransformBuilder.translate(200, 200).scale(0.5, 0.5).transform);
  root.addChild(child);
  // Cannot add root to child
  expect(() => child.addChild(root)).toThrow();
  // cannot add child to self
  expect(() => child.addChild(child)).toThrow();

  const onRootRender = jest.fn();
  root.onRender(onRootRender);

  const onChildRender = jest.fn();
  child.onRender(onChildRender);

  child.requestFrameRender([0, 0, 100, 100]);

  // trigger frame
  (root as any).onFrame();
  expect(onRootRender).toHaveBeenCalled();
  expect(onRootRender.mock.calls[0][0].rects).toEqual([[200, 200, 50, 50]]);
  expect(onChildRender).toHaveBeenCalled();
  expect(onChildRender.mock.calls[0][0].rects).toEqual([[0, 0, 100, 100]]);
});
