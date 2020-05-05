import { Position } from './position';
import { DragNodeInput } from './node-input';

export interface DragNode {
  title: string;
  position: Position;
  inputs: DragNodeInput[];
}
