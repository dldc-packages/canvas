import { PixelRatio, createGroup, createRenderer } from '@mod';
import { Clear } from './Clear';
import { MovingRect } from './MovingRect';
import { RenderArea } from './RenderArea';

const rootEl = document.getElementById('root')!;
const target = document.createElement('div');
Object.assign(target.style, { position: 'fixed', inset: '50px' });
rootEl.appendChild(target);

const renderer = createRenderer({
  target,
  layer: PixelRatio(
    createGroup({
      children: [
        Clear(),
        RenderArea(),
        MovingRect('#000000'),
        MovingRect('#222222'),
        MovingRect('#444444'),
        MovingRect('#666666'),
        MovingRect('#888888'),
        MovingRect('#aaaaaa'),
        MovingRect('#cccccc'),
        MovingRect('#eeeeee'),
      ],
    }),
  ),
});

console.log(renderer);
