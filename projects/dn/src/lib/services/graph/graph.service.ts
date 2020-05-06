import { Injectable } from '@angular/core';
import { Subject, ReplaySubject } from 'rxjs';
import { scan } from 'rxjs/operators';
import produce from 'immer';

import { GraphAction } from './graph-actions';
import { GraphNode, InputPort, OutputPort, Port } from '../../data/graph-types';
import { Position } from '../../data/position';

export interface GraphState {
  nodes: GraphNode[];
  connections: { from: OutputPort, to: InputPort }[];
  draggedConnections: Map<Port, Position>;
}

@Injectable({
  providedIn: 'root'
})
export class GraphService {

  private actions = new Subject<GraphAction>();

  public state = new ReplaySubject<GraphState>(1);

  constructor() {
    const initialState: GraphState = { nodes: [], connections: [], draggedConnections: new Map() };
    const actionHandler = produce((state, action) => this.handleAction(state, action));

    this.actions.pipe(scan(actionHandler, initialState)).subscribe(this.state);
    this.state.subscribe();
    this.state.next(initialState);
  }

  private handleAction(state: GraphState, action: GraphAction): GraphState {
    switch (action.type) {
      case 'add node':
        state.nodes.push(action.node);
        break;
      case 'remove node': {
        const index = state.nodes.findIndex(n => n.name === action.node.name);
        state.nodes.splice(index, 1);
        state.connections = state.connections.filter(({ from, to }) => (
          from.parent.name !== action.node.name && to.parent.name !== action.node.name
        ));
        action.node.inputs.forEach(i => state.draggedConnections.delete(i));
        action.node.outputs.forEach(o => state.draggedConnections.delete(o));
        break;
      }
      case 'move node': {
        const index = state.nodes.findIndex(n => n.name === action.node.name);
        state.nodes[index].position = action.position;
        break;
      }
      case 'drag port connection': {
        state.draggedConnections.set(action.origin, action.cursor);
        break;
      }
      case 'release port connection':
        state.draggedConnections.delete(action.origin);
        break;
      case 'connect port': {
        if (action.input.parent !== action.output.parent &&
          !state.connections.some(({ from, to }) =>
            (from.name === action.output.name && from.parent.name === action.output.parent.name) ||
            (to.name === action.input.name && to.parent.name === action.input.parent.name)
          )
        ) {
          state.connections.push({ from: action.output, to: action.input });
        }
        break;
      }
      case 'disconnect port': {
        const index = state.connections.findIndex(({ from, to }) =>
          (from.name === action.output.name && from.parent.name === action.output.name) &&
          (to.name === action.input.name && to.parent.name === action.input.parent.name)
        );
        if (index >= 0) {
          state.connections.splice(index, 1);
        }
        break;
      }
    }
    return state;
  }

  addNode(node: GraphNode) {
    this.actions.next({ type: 'add node', node });
  }

  removeNode(node: GraphNode) {
    this.actions.next({ type: 'remove node', node });
  }

  moveNode(node: GraphNode, position: Position) {
    this.actions.next({ type: 'move node', node, position });
  }

  dragPortConnection(origin: Port, cursor: Position) {
    this.actions.next({ type: 'drag port connection', origin, cursor });
  }

  releasePortConnection(origin: Port) {
    this.actions.next({ type: 'release port connection', origin });
  }

  connectPorts(output: OutputPort, input: InputPort) {
    this.actions.next({ type: 'connect port', output, input });
  }

  disconnectPorts(output: OutputPort, input: InputPort) {
    this.actions.next({ type: 'disconnect port', output, input });
  }
}
