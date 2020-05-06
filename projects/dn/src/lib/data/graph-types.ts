import { Subject, Subscription, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Position } from './position';

declare const console: any;

type Value = string;

class Graph {
  private nodes: GraphNode[] = [];

  private connections: Connection[] = [];

  private dragConnection?: DragConnection;

  addNode(node: GraphNode) {
    this.nodes.push(node);
  }

  startDragConnectionFromSource(output: OutputPort) {
    this.dragConnection = DragConnection.startFromOutput(output);
  }

  startDragConnectionFromSink(input: InputPort) {
    this.dragConnection = DragConnection.startFromInput(input);
  }
}

const outputs = Symbol('outputs');
const inputs = Symbol('inputs');

export class GraphNode {
  [outputs]?: OutputPort[] = [];
  [inputs]?: InputPort[] = [];

  get outputs(): OutputPort[] { return [...this[outputs]]; }
  get inputs(): InputPort[] { return [...this[inputs]]; }

  constructor(
    public readonly name: string,
    public readonly position: Position = { x: 0, y: 0 }
  ) { }

  addOutputs(...newOutputs: OutputPort[]) {
    newOutputs
      .filter(ns => this[outputs].every(s => s !== ns))
      .forEach(ns => {
        this[outputs].push(ns);
        ns.parent = this;
      });
  }

  addInputs(...newInputs: InputPort[]) {
    newInputs
      .filter(ns => this[inputs].every(s => s !== ns))
      .forEach(ns => {
        this[inputs].push(ns);
        ns.parent = this;
      });
  }
}

function hasCircularDependency(fromUpstream: GraphNode, toDownstream: GraphNode): boolean {
  const visited = new Set<GraphNode>();
  const fringe = new Set<GraphNode>();
  fringe.add(fromUpstream);

  while (fringe.size > 0) {
    const next = fringe.values().next().value as GraphNode;
    if (next === toDownstream) {
      return true;
    }
    visited.add(next);
    fringe.delete(next);
    next.inputs
      .map(s => s.parent)
      .filter(n => !!n && !visited.has(n))
      .forEach(n => fringe.add(n));
  }

  return false;
}

export interface Port {
  parent: GraphNode;
  connection?: Connection;
  readonly name: string;
  readonly isConnected: boolean;
}

export class OutputPort implements Port {
  connection?: Connection = null;
  parent: GraphNode;

  get isConnected() { return this.connection !== null; }

  constructor(
    public readonly name: string,
    public readonly observable: Observable<Value>
  ) { }

  canReceiveConnectionFrom(sender: any): boolean {
    console.log('checking from', this, 'to input', sender);
    if (!(sender instanceof InputPort) || this.isConnected) {
      return false;
    }

    return !hasCircularDependency(this.parent, sender.parent);
  }
}

export class InputPort implements Port {
  parent: GraphNode;
  connection?: Connection;

  get isConnected() { return this.connection !== null; }

  subject = new Subject<Value>();

  constructor(
    public readonly name: string
  ) { }

  canReceiveConnectionFrom(sender: any): boolean {
    console.log('checking from', this, 'to output', sender);
    if (this.isConnected || !(sender instanceof OutputPort)) {
      return false;
    }
    return !hasCircularDependency(sender.parent, this.parent);
  }
}

export class DragConnection {
  constructor(
    private output?: OutputPort,
    private input?: InputPort
  ) { }

  static startFromOutput(output: OutputPort) {
    return new DragConnection(output, null);
  }

  static startFromInput(input: InputPort) {
    return new DragConnection(null, input);
  }
}

export class Connection {
  private latestValue?: Value;
  private subscription: Subscription;

  get latest() {
    return this.latestValue;
  }

  private constructor(
    public readonly from: OutputPort,
    public readonly to: InputPort
  ) { }

  static connect(output: OutputPort, input: InputPort): Connection {
    const connection = new Connection(
      output,
      input
    );
    connection.subscription = output.observable.pipe(tap(v => connection.latestValue = v)).subscribe(input.subject);

    output.connection = connection;
    input.connection = connection;

    return connection;
  }

  clear() {
    this.subscription.unsubscribe();
  }
}
