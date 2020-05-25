import { InputPort, OutputPort, Port, GraphNode } from '../../data/graph-types';
import { Position } from '../../data/position';

export interface AddNodeAction {
  readonly type: 'add node';
  readonly node: GraphNode;
}

export interface RemoveNodeAction {
  readonly type: 'remove node';
  readonly node: GraphNode;
}

export interface MoveNodeAction {
  readonly type: 'move node';
  readonly node: GraphNode;
  readonly position: Position;
}

export interface DragPortConnectionAction {
  readonly type: 'drag port connection';
  readonly origin: Port;
  readonly cursor: Position;
}

export interface ReleasePortConnectionAction {
  readonly type: 'release port connection';
  readonly origin: Port;
}

export interface ConnectPortAction {
  readonly type: 'connect port';
  readonly output: Port;
  readonly input: Port;
}

export interface DisconnectPortAction {
  readonly type: 'disconnect port';
  readonly output: OutputPort;
  readonly input: InputPort;
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
