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

export interface StartPortConnectionDragAction {
  readonly type: 'start port connection drag';
  readonly origin: Port;
  readonly interaction: Interact.Interaction;
  readonly interactable: Interact.Interactable;
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
  readonly droppedOn: Port;
  readonly from: Port;
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
  | StartPortConnectionDragAction
  | DragPortConnectionAction
  | ReleasePortConnectionAction
  | ConnectPortAction
  | DisconnectPortAction
  ;
