import { Injectable } from '@angular/core';
import { Subject, ReplaySubject } from 'rxjs';
import { scan, takeUntil, map } from 'rxjs/operators';

import { GraphAction } from './graph-actions';
import { GraphNode, InputPort, OutputPort, Port } from '../../data/graph-types';
import { Position } from '../../data/position';
import { reduceAction } from './reducers';

export interface GraphState {
  nodes: GraphNode[];
  connections: { output: OutputPort, input: InputPort }[];
  draggedConnections: Map<Port, Position>;
}

@Injectable({
  providedIn: 'root'
})
export class GraphService {
  private unsubscribe = new Subject();

  public readonly actions = new Subject<GraphAction>();

  public readonly state = new ReplaySubject<GraphState>(1);

  public readonly visibleConnections = new ReplaySubject<{ from: Position | OutputPort, to: Position | InputPort }[]>();

  constructor() {
    const initialState: GraphState = { nodes: [], connections: [], draggedConnections: new Map() };

    this.actions.pipe(
      scan((state, action) => reduceAction(state, action), initialState),
      takeUntil(this.unsubscribe)
    ).subscribe(this.state);
    this.state.next(initialState);

    this.state.pipe(
      map(s => [].concat(
        s.connections
          .filter(c => !s.draggedConnections.has(c.output) && !s.draggedConnections.has(c.input))
          .map(c => ({ from: c.output, to: c.input })),
        [...s.draggedConnections.entries()].map(([from, to]) => {
          const fromIsOutput = from instanceof OutputPort;
          return {
            from: fromIsOutput ? from : to,
            to: fromIsOutput ? to : from
          };
        })
      )),
      takeUntil(this.unsubscribe)
    ).subscribe(this.visibleConnections);
  }

  private sendAction(action: GraphAction) {
    setTimeout(() => this.actions.next(action));
  }

  addNode(node: GraphNode) {
    this.sendAction({ type: 'add node', node });
  }

  removeNode(node: GraphNode) {
    this.sendAction({ type: 'remove node', node });
  }

  moveNode(node: GraphNode, position: Position) {
    this.sendAction({ type: 'move node', node, position });
  }

  dragPortConnection(origin: Port, cursor: Position) {
    this.sendAction({ type: 'drag port connection', origin, cursor });
  }

  releasePortConnection(origin: Port) {
    this.sendAction({ type: 'release port connection', origin });
  }

  connectPorts(input: OutputPort, output: InputPort) {
    this.sendAction({ type: 'connect port', input, output });
  }

  disconnectPorts(output: OutputPort, input: InputPort) {
    this.sendAction({ type: 'disconnect port', output, input });
  }
}
