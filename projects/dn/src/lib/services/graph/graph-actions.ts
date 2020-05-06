import { InputPort, OutputPort, Port, GraphNode } from '../../data/graph-types';
import { Position } from '../../data/position';

interface GraphActionBase {
  type: string;
}

interface AddNodeAction extends GraphActionBase {
  type: 'add node';
  node: GraphNode;
}

interface RemoveNodeAction extends GraphActionBase {
  type: 'remove node';
  node: GraphNode;
}

interface MoveNodeAction extends GraphActionBase {
  type: 'move node';
  node: GraphNode;
  position: Position;
}

interface DragPortConnectionAction extends GraphActionBase {
  type: 'drag port connection';
  origin: Port;
  cursor: Position;
}

interface ReleasePortConnectionAction extends GraphActionBase {
  type: 'release port connection';
  origin: Port;
}

interface ConnectPortAction extends GraphActionBase {
  type: 'connect port';
  output: OutputPort;
  input: InputPort;
}

interface DisconnectPortAction extends GraphActionBase {
  type: 'disconnect port';
  output: OutputPort;
  input: InputPort;
}

export type GraphAction
  = AddNodeAction
  | RemoveNodeAction
  | MoveNodeAction
  | DragPortConnectionAction
  | ReleasePortConnectionAction
  | ConnectPortAction
  | DisconnectPortAction
  ;
