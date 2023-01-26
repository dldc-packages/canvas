import { Geometry, Group, ILayer, Layer, Renderer } from './lib/mod';

const rootEl = document.getElementById('root')!;

const target = document.createElement('div');
Object.assign(target.style, { position: 'fixed', inset: '50px' });
rootEl.appendChild(target);

const renderer = Renderer.create({
  target,
  layer: Group.create({ children: [Rect()] }),
});

function Rect(): ILayer {
  return {
    ref: Layer.createRef({
      onRect: ({ view }) => view,
      onRender: ({ tools, view }) => {
        tools.ctx.fillStyle = 'red';
        tools.ctx.fillRect(...Geometry.Rect.expand(view, -20));
      },
    }),
  };
}
