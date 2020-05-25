import { Position } from './position';

export function isSamePort(a: Port, b: Port): boolean {
  return a.name === b.name && a.parent.name === b.parent.name;
}

export function isSameNode(a: GraphNode, b: GraphNode): boolean {
  return a.name === b.name;
}

export interface GraphNode {
  outputs: OutputPort[];
  inputs: InputPort[];
  readonly name: string;
  position: Position;
}

interface IPort {
  readonly type: 'input' | 'output';
  parent: GraphNode;
  readonly name: string;
}

export type Port = OutputPort | InputPort;

export class OutputPort implements IPort {
  type: 'output';

  constructor(
    public readonly name: string,
    public readonly parent: GraphNode
  ) { }
}

export class InputPort implements IPort {
  type: 'input';

  constructor(
    public readonly name: string,
    public readonly parent: GraphNode
  ) { }
}
