import { ConnectorType } from './node-connection-type';
import { DragNode } from './node';

export interface DragNodeInput<T extends ConnectorType> {
  parent: DragNode;
  connectedTo?: DragNode;
  connectionType: T;
}
