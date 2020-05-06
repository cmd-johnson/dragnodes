import { Injectable } from '@angular/core';
import { GraphNode, InputPort, OutputPort, Port } from '../../data/graph-types';
import { Position } from '../../data/position';
import { Subject, Observable } from 'rxjs';
import { scan } from 'rxjs/operators';
import produce from 'immer';

interface GraphActionBase {
  type: string;
}

interface AddNodeAction extends GraphActionBase {
  type: 'add node';
  data: GraphNode;
}

interface RemoveNodeAction extends GraphActionBase {
  type: 'remove node';
  data: GraphNode;
}

interface MoveNodeAction extends GraphActionBase {
  type: 'move node';
  data: {
    node: GraphNode,
    delta: {
      dx: number,
      dy: number
    }
  };
}

interface ConnectPortAction extends GraphActionBase {
  type: 'connect port';
  data: {
    output: OutputPort,
    input: InputPort
  };
}

interface DisconnectPortAction extends GraphActionBase {
  type: 'disconnect port';
  data: {
    output: OutputPort,
    input: InputPort
  };
}

type GraphAction
  = AddNodeAction
  | RemoveNodeAction
  | MoveNodeAction
  | ConnectPortAction
  | DisconnectPortAction
  ;

interface GraphState {
  nodes: GraphNode[];
  connections: { from: OutputPort, to: InputPort }[];
  draggedConnections: { from: Port, to: Position }[];
}

@Injectable({
  providedIn: 'root'
})
export class GraphService {

  private actions = new Subject<GraphAction>();

  private state: Observable<GraphState>;

  constructor() {
    const initialState: GraphState = { nodes: [], connections: [], draggedConnections: [] };
    const actionHandler = produce(this.handleAction.bind(this));
    this.state = this.actions.pipe(scan(
      // produce(oldState, draftState => this.handleAction(draftState, action)),
      // (oldState, action) => produce((draft) => this.handleAction(draft, action))(oldState),
      actionHandler,
      initialState
    ));
  }

  private handleAction(state: GraphState, action: GraphAction): GraphState {
    console.log(state, action);
    switch (action.type) {
      case 'add node':
        break;
      case 'remove node':
        break;
      case 'move node':
        break;
      case 'connect port':
        break;
    }
    return state;
  }

  addNode(node: GraphNode) {
    this.actions.next({ type: 'add node', data: node });
  }

  removeNode(node: GraphNode) {
    this.actions.next({ type: 'remove node', data: node });
  }

  moveNode(node: GraphNode, delta: { dx: number, dy: number }) {
    this.actions.next({ type: 'move node', data: { node, delta }});
  }

  connectPorts(output: OutputPort, input: InputPort) {
    this.actions.next({ type: 'connect port', data: { output, input } });
  }
}
