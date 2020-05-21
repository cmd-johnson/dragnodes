import { Observable } from 'rxjs';
import { Position } from './position';

export function isSamePort(a: Port, b: Port): boolean {
  return a.name === b.name && a.parent.name === b.parent.name;
}

export function isSameNode(a: GraphNode, b: GraphNode): boolean {
  return a.name === b.name;
}

type Value = string;

const outputs = Symbol('outputs');
const inputs = Symbol('inputs');

export class GraphNode {
  [outputs]?: OutputPort[] = [];
  [inputs]?: InputPort[] = [];

  get outputs(): Readonly<OutputPort[]> { return [...this[outputs]]; }
  get inputs(): Readonly<InputPort[]> { return [...this[inputs]]; }

  constructor(
    public readonly name: string,
    public position: Position = { x: 0, y: 0 }
  ) { }

  addOutput(...newOutputs: OutputPort[]) {
    newOutputs
      .filter(ns => this[outputs].every(s => s !== ns))
      .forEach(ns => {
        this[outputs].push(ns);
        ns.parent = this;
      });
  }

  removeOutput(...remove: OutputPort[]) {
    this[outputs] = (this[outputs] || []).filter(o => remove.some(r => isSamePort(o, r)));
  }

  addInput(...newInputs: InputPort[]) {
    newInputs
      .filter(ns => this[inputs].every(s => s !== ns))
      .forEach(ns => {
        this[inputs].push(ns);
        ns.parent = this;
      });
  }

  removeInput(...remove: InputPort[]) {
    this[inputs] = (this[inputs] || []).filter(o => remove.some(r => isSamePort(o, r)));
  }
}

interface IPort {
  parent: GraphNode;
  readonly name: string;
}

export type Port = OutputPort | InputPort;

export class OutputPort implements IPort {
  parent: GraphNode;

  constructor(
    public readonly name: string,
    public readonly observable: Observable<Value>
  ) { }
}

export class InputPort implements IPort {
  parent: GraphNode;

  constructor(
    public readonly name: string
  ) { }
}
