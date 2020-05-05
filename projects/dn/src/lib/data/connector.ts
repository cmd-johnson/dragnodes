import { ConnectorType } from './connector-type';
import { never, Observable } from 'rxjs';

export class Connection<T extends ConnectorType<V>, V = ConnectorTypeValue<T>> {
  private constructor(
    public readonly source: SourceConnector<T>,
    public readonly sink: SinkConnector<T>
  ) { }

  static connect<T extends ConnectorType<any>>(source: SourceConnector<T>, sink: SinkConnector<T>) {
    if (source.canConnectTo(sink) && sink.canConnectFrom(source)) {
      const connection = new Connection(source, sink);
      source.addConnection(connection);
      sink.addConnection(connection);
    }
  }
}



class InvalidSourceError extends Error {
  constructor(source: SourceConnector<any>, connection: Connection<any>) {
    super(`Cannot add connection with source ${connection.source} to source connector ${source}`);
  }
}

class ConnectionLimitExceededError extends Error {
  constructor(connector: Connector<any>, limit: number) {
    super(`Cannot add more than ${limit} connections to ${connector}`);
  }
}

class DuplicateSinkError extends Error {
  constructor(source: SourceConnector<any>, sink: SinkConnector<any>) {
    super(`${source} already contains a connection to ${sink}`);
  }
}

class DuplicateSourceError extends Error {
  constructor(source: SourceConnector<any>, sink: SinkConnector<any>) {
    super(`${sink} already contains a connection from ${source}`);
  }
}

abstract class Connector<T extends ConnectorType<V>, V = ConnectorTypeValue<T>> {
  constructor(
    public readonly type: T,
    protected maxConnections = 1
  ) { }
}

const PrivateType = Symbol();
class A<T> { [PrivateType]: T; }
type NestedType<X> = X extends A<infer T> ? T : never;
class C extends A<string> { }
type Test = NestedType<C>;
const t: Test = 'asdf';

export class SourceConnector<T extends ConnectorType<any>> extends Connector<T> {
  private downstream: Connection<T>[] = [];

  value: ConnectorTypeValue<T>;

  canConnectTo(sink: SinkConnector<T>) {
    return this.downstream.length < this.maxConnections && !this.downstream.some(c => c.sink === sink);
  }

  addConnection(connection: Connection<T>) {
    if (connection.source !== this) {
      throw new Error(`Cannot add connection with source ${connection.source} to source ${this}`);
    } else if (this.downstream.length >= this.maxConnections) {
      throw new ConnectionLimitExceededError(connection.source, this.maxConnections);
    } else if (this.downstream.some(c => c.sink === connection.sink)) {
      throw new DuplicateSinkError(this, connection.sink);
    }
    this.downstream.push(connection);
  }

  removeConnection(connection: Connection<T>) {
    this.downstream = this.downstream.filter(c => c !== connection);
  }
}

export class SinkConnector<T extends ConnectorType<any>> extends Connector<T> {
  private upstream: Connection<T>[] = [];

  value: ConnectorTypeValue<T>;

  canConnectFrom(source: SourceConnector<T>) {
    return this.upstream.length < this.maxConnections && !this.upstream.some(c => c.source === source);
  }

  addConnection(connection: Connection<T>) {
    if (connection.sink !== this) {
      throw new Error(`Cannot add connection with sink ${connection.sink} to sink ${this}`);
    } else if (this.upstream.length >= this.maxConnections) {
      throw new ConnectionLimitExceededError(connection.source, this.maxConnections);
    } else if (this.upstream.some(c => c.source === connection.source)) {
      throw new DuplicateSourceError(connection.source, this);
    }
    this.upstream.push(connection);
  }

  removeConnection(connection: Connection<T>) {
    if (connection.sink !== this) {
      throw new Error(`Cannot remove connection with sink ${connection.sink} from sink ${this}`);
    }
    this.upstream = this.upstream.filter(c => c.source !== connection.source);
  }
}
