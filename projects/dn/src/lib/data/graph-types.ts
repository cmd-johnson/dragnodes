import { Subject, Subscription, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Position } from './position';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';

declare const console: any;

type Value = string;

class Graph {
  private nodes: Node[] = [];

  private connections: Connection[] = [];

  private dragConnection?: DragConnection;

  addNode(node: Node) {
    this.nodes.push(node);
  }

  startDragConnectionFromSource(source: Source) {
    this.dragConnection = DragConnection.startFromSource(source);
  }

  startDragConnectionFromSink(sink: Sink) {
    this.dragConnection = DragConnection.startFromSink(sink);
  }
}

const sources = Symbol();
const sinks = Symbol();

export class Node {
  [sources]?: Source[] = [];
  [sinks]?: Sink[] = [];

  get sources(): Source[] { return [...this[sources]]; }
  get sinks(): Sink[] { return [...this[sinks]]; }

  constructor(
    public readonly title: string,
    public readonly position: Position = { x: 0, y: 0 }
  ) { }

  addSources(...newSources: Source[]) {
    newSources
      .filter(ns => this[sources].every(s => s !== ns))
      .forEach(ns => {
        this[sources].push(ns);
        ns.parent = this;
      });
  }

  addSinks(...newSinks: Sink[]) {
    newSinks
      .filter(ns => this[sinks].every(s => s !== ns))
      .forEach(ns => {
        this[sinks].push(ns);
        ns.parent = this;
      });
  }
}

function hasCircularDependency(fromUpstream: Node, toDownstream: Node): boolean {
  const visited = new Set<Node>();
  const fringe = new Set<Node>();
  fringe.add(fromUpstream);

  while (fringe.size > 0) {
    const next = fringe.values().next().value as Node;
    if (next === toDownstream) {
      return true;
    }
    visited.add(next);
    fringe.delete(next);
    next.sinks
      .map(s => s.parent)
      .filter(n => !!n && !visited.has(n))
      .forEach(n => fringe.add(n));
  }

  return false;
}

export class Source {
  connection?: Connection = null;
  parent: Node;

  get isConnected() { return this.connection !== null; }

  constructor(
    public readonly name: string,
    public readonly observable: Observable<Value>
  ) { }

  canReceiveConnectionFrom(sender: any): boolean {
    console.log('checking from', this, 'to source', sender);
    if (!(sender instanceof Sink) || this.isConnected) {
      return false;
    }

    return !hasCircularDependency(this.parent, sender.parent);
  }
}

export class Sink {
  parent: Node;
  connection?: Connection;

  get isConnected() { return this.connection !== null; }

  subject = new Subject<Value>();

  constructor(
    public readonly name: string
  ) { }

  canReceiveConnectionFrom(sender: any): boolean {
    console.log('checking from', this, 'to sink', sender);
    if (this.isConnected || !(sender instanceof Source)) {
      return false;
    }
    return !hasCircularDependency(sender.parent, this.parent);
  }
}

export class DragConnection {
  constructor(
    private source?: Source,
    private sink?: Sink
  ) { }

  static startFromSource(source: Source) {
    return new DragConnection(source, null);
  }

  static startFromSink(sink: Sink) {
    return new DragConnection(null, sink);
  }
}

export class Connection {
  private latestValue?: Value;

  get latest() {
    return this.latestValue;
  }

  private constructor(
    public readonly from: Source,
    public readonly to: Sink,
    private subscription: Subscription
  ) { }

  static connect(source: Source, sink: Sink): Connection {
    const connection = new Connection(
      source,
      sink,
      source.observable.pipe(tap(v => connection.lastValue = v)
    ).subscribe(sink.subject));

    source.connection = connection;
    sink.connection = connection;

    return connection;
  }

  clear() {
    this.subscription.unsubscribe();
  }
}
