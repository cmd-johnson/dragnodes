import { BehaviorSubject, ReplaySubject, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { ExtReadonlyMap } from '../util/extended-readonly-map';

export type Pos = { x: number, y: number };

export type GraphNodeType
  = 'numvar' | 'boolvar'
  | 'sum'
  | 'if'
  ;

export type GraphValueType = 'num' | 'bool';

export interface GraphNodeData<T = undefined> {
  type: GraphNodeType;
  position?: { x: number, y: number };
  inputs?: {
    [group: string]: {
      connectedTo?: { node: number, group: string, output: number }
    }[]
  };
  data?: T;
}

export abstract class Port<T, Other extends Port<any, any>> {
  readonly $connectedTo: BehaviorSubject<Other | null>;
  get connectedTo(): Other {
    return this.$connectedTo.value;
  }

  abstract readonly portType: 'input' | 'output';

  constructor(
    public readonly node: GraphNode<T>,
    public readonly group: string,
    public readonly type: GraphValueType,
    public readonly title: string,
  ) {
    this.$connectedTo = new BehaviorSubject(null);
  }

  canConnectPortTo(other: Readonly<Other>): boolean {
    if (this.type !== other.type) {
      return false; // Cannot connect inputs to inputs or outputs to outputs.
    } else if (this.connectedTo !== null || other.connectedTo !== null) {
      return false; // Cannot add connections to already connected ports.
    } else if (this.node === other.node) {
      return false; // Cannot add connections between inputs or outputs of the same node.
    }
    const from = this.portType === 'output' ? this : other;
    const to = this.portType === 'input' ? this : other;
    return !this.connectingIntroducesCycle(from, to);
  }

  private connectingIntroducesCycle(from: Readonly<Port<any, any>>, to: Readonly<Port<any, any>>): boolean {
    function getDownstreamNodes(node: GraphNode<any>): readonly GraphNode<any>[] {
      return [...node.outputs.values()]
        .reduce((a, b) => a.concat(b), [])
        .filter(p => !!p.connectedTo)
        .map(p => p.connectedTo.node);
    }

    const fringe = new Set<GraphNode<any>>([to.node]);
    const visited = new Set<GraphNode<any>>();
    while (fringe.size > 0) {
      const nextNode: GraphNode = fringe.values().next().value;
      if (nextNode === from.node) {
        return true; // Cycle detected!
      }
      visited.add(nextNode);
      fringe.delete(nextNode);
      getDownstreamNodes(nextNode)
        .filter(n => !visited.has(n))
        .forEach(n => fringe.add(n));
    }
    return false;
  }

  connectPortTo(other: Readonly<Other>): void {
    if (this.canConnectPortTo(other)) {
      this.$connectedTo.next(other);
      other.$connectedTo.next(this);
    } else {
      throw new Error(`Cannot connect port ${this} to ${other}`);
    }
  }

  disconnectPort() {
    if (this.connectedTo) {
      this.connectedTo.$connectedTo.next(null);
      this.$connectedTo.next(null);
    }
  }
}

export class Input<V = any, T = any> extends Port<T, Output<V, T>> {
  readonly $value: Observable<V> = this.$connectedTo.pipe(
    switchMap(i => i == null ? of(null) : i.$value)
  );
  readonly portType = 'input';
}
export class Output<V = any, T = any> extends Port<T, Input<V, T>> {
  readonly $value = new ReplaySubject<V>();

  readonly portType = 'output';
}

export abstract class GraphNode<T = undefined> {
  abstract readonly title: string;
  abstract readonly nodeType: GraphNodeType;

  private inputPorts = new Map<string, Input[]>();
  private outputPorts = new Map<string, Output[]>();

  get inputs(): ExtReadonlyMap<string, Readonly<Input>[]> {
    return this.inputPorts;
  }
  get outputs(): ExtReadonlyMap<string, Readonly<Output[]>> {
    return this.outputPorts;
  }

  constructor(
    public position: Pos = { x: 0, y: 0 }
  ) { }

  protected setInputGroups(
    inputs: { [group: string]: { type: GraphValueType, title: string }[] }
  ): ExtReadonlyMap<string, Readonly<Input>[]> {
    this.inputPorts = new Map(Object.keys(inputs).map(group => [
      group, inputs[group].map(i => new Input(this, group, i.type, i.title))
    ]));
    return this.inputs;
  }

  protected setInputs(...inputs: { type: GraphValueType, title: string }[]): Input[] {
    const ports = inputs.map(i => new Input(this, '', i.type, i.title));
    this.inputPorts = new Map([['', ports]]);
    return ports;
  }

  protected setOutputGroups(
    outputs: { [group: string]: { type: GraphValueType, title: string }[] }
  ): ExtReadonlyMap<string, Readonly<Output>[]> {
    this.outputPorts = new Map(Object.keys(outputs).map(group => [
      group, outputs[group].map(o => new Output(this, group, o.type, o.title))
    ]));
    return this.outputs;
  }

  protected setOutputs(...outputs: { type: GraphValueType, title: string }[]): Output[] {
    const ports = outputs.map(o => new Output(this, '', o.type, o.title));
    this.outputPorts = new Map([['', ports]]);
    return ports;
  }

  deserializeNodeData(data: unknown) { }

  serializeNodeData(): T {
    return undefined;
  }
}
