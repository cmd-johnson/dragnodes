import { ExtReadonlyMap } from '../util/extended-readonly-map';
import { BehaviorSubject } from 'rxjs';

export type Pos = { x: number, y: number };

export type GraphNodeType
  = 'numvar' | 'boolvar'
  | 'sum'
  | 'if'
  ;

export type GraphValueType = 'num' | 'bool';

export interface GraphNodeData<T> {
  type: GraphNodeType;
  id: number;
  position: { x: number, y: number };
  inputs: {
    [group: string]: {
      id: number,
      connectedTo?: { node: number, group: string, output: number }
    }[]
  };
  data: T;
}

abstract class Port<T, Other extends Port<any, any>> {
  readonly $connectedTo: BehaviorSubject<Other | null>;
  get connectedTo(): Other {
    return this.$connectedTo.value;
  }

  public abstract readonly portType: string;

  constructor(
    public readonly node: GraphNode<T>,
    public readonly group: string,
    public readonly type: GraphValueType,
    public readonly title: string,
    public readonly id: number,
    connectedTo: Other | null = null
  ) {
    this.$connectedTo = new BehaviorSubject(connectedTo);
  }

  canConnectPortTo(other: Other): boolean {
    if (this.type !== other.type) {
      return false;
    } else if (this.connectedTo !== null || other.connectedTo !== null) {
      return false;
    } else if (this.node === other.node) {
      return false;
    }
    // TODO: check for cycles in the graph
    return true;
  }

  connectPortTo(other: Other): void {
    if (this.canConnectPortTo(other)) {

    }
  }
}

export class Input<T = any> extends Port<T, Output<T>> {
  public readonly portType = 'input';
}
export class Output<T = any> extends Port<T, Input<T>> {
  public readonly portType = 'output';
}

export abstract class GraphNode<T = undefined> {
  abstract readonly title: string;
  public readonly abstract nodeType: GraphNodeType;

  get inputPorts(): ExtReadonlyMap<string, Readonly<Input>[]> {
    return this.inputs;
  }
  get outputPorts(): ExtReadonlyMap<string, Readonly<Output[]>> {
    return this.outputs;
  }

  constructor(
    private inputs: Map<string, Input[]>,
    private outputs: Map<string, Output[]>,
    public readonly id: number,
    public position: Pos = { x: 0, y: 0 }
  ) { }

  protected serializeCommon(data: T): GraphNodeData<T> {
    const inputs = [...this.inputs.entries()].reduce((acc, [key, inp]) => ({
      ...acc,
      [key]: inp.map(i => ({
        id: i.id,
        connectedTo: i.connectedTo && {
          node: i.connectedTo.node.id,
          group: i.connectedTo.group,
          output: i.connectedTo.id
        }
      }))
    }), {} as GraphNodeData<T>['inputs']);

    return {
      type: this.nodeType,
      id: this.id,
      position: { ...this.position },
      inputs,
      data
    };
  }
  abstract serialize(): GraphNodeData<T>;
}
