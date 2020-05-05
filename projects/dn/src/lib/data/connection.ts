import { ConnectorType } from './connector-type';
import { SourceConnector, SinkConnector } from './connector';

export interface Connection<V, T extends ConnectorType> {
  source: SourceConnector<V, T>;
  sink: SinkConnector<V, T>;
}
