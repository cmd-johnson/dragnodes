import { Injectable } from '@angular/core';
import { Subject, ReplaySubject } from 'rxjs';
import { scan, takeUntil, map, tap, take } from 'rxjs/operators';
import produce from 'immer';

import { GraphAction } from './graph-actions';
import { GraphNode, InputPort, OutputPort, Port } from '../../data/graph-types';
import { Position } from '../../data/position';
import { reducers } from './reducers';
import { ResolvePortService } from '../resolve-port/resolve-port.service';

export interface GraphState {
  nodes: GraphNode[];
  connections: { from: OutputPort, to: InputPort }[];
  draggedConnections: Map<Port, Position>;
  detachedDraggedConnections: Map<Port, { remainingOrigin: Port, cursorPosition: Position, released: boolean }>;
}

@Injectable({
  providedIn: 'root'
})
export class GraphService {
  private unsubscribe = new Subject();

  private actions = new Subject<GraphAction>();

  public state = new ReplaySubject<GraphState>(1);

  public visibleConnections = new ReplaySubject<{ from: Position | OutputPort, to: Position | InputPort }[]>();

  constructor(
    private resolvePort: ResolvePortService
  ) {
    const initialState: GraphState = { nodes: [], connections: [], draggedConnections: new Map(), detachedDraggedConnections: new Map() };
    const actionHandler = produce((state, action) => reducers
      .filter(({ filter }) => filter === action.type)
      .reduce((s, r) => {
        try {
          return r.reducer(s, action as any);
        } catch (e) {
          console.error('reducer errored:', e);
          return s;
        }
      }, state)
    );

    this.actions.pipe(
      tap(a => {
        //if (a.type !== 'move node' && a.type !== 'drag port connection') {
          console.log(a);
        //}
      }),
      scan(actionHandler, initialState),
      takeUntil(this.unsubscribe)
    ).subscribe(this.state);
    this.state.next(initialState);

    this.state.pipe(
      map(s => [].concat(
        s.connections.map(c => ({...c})),
        [...s.draggedConnections.entries()].map(([from, to]) => {
          const fromIsOutput = from instanceof OutputPort;
          return {
            from: fromIsOutput ? from : to,
            to: fromIsOutput ? to : from
          };
        }),
        [...s.detachedDraggedConnections.values()].filter(({ released }) => !released).map(({ remainingOrigin, cursorPosition }) => {
          const originIsOutput = remainingOrigin instanceof OutputPort;
          return {
            from: originIsOutput ? remainingOrigin : cursorPosition,
            to: originIsOutput ? cursorPosition : remainingOrigin
          };
        })
      )),
      takeUntil(this.unsubscribe)
    ).subscribe(this.visibleConnections);
  }

  private sendAction(action: GraphAction) {
    this.actions.next(action);
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

  startPortConnectionDrag(origin: Port, interaction: Interact.Interaction, interactable: Interact.Interactable) {
    this.state.pipe(take(1)).subscribe(s => {
      if (!s.connections.some(c => c.from === origin || c.to === origin)) {
        this.resolvePort.getPortDirective(origin).startDrag(interaction, interactable);
      } else {
        const connection = s.connections.find(c => c.from === origin || c.to === origin);
        if (connection.from === origin) {
          this.resolvePort.getPortDirective(connection.to).startDrag(interaction, interactable);
        } else {
          this.resolvePort.getPortDirective(connection.from).startDrag(interaction, interactable);
        }
      }
    });
  }

  dragPortConnection(origin: Port, cursor: Position) {
    this.sendAction({ type: 'drag port connection', origin, cursor });
  }

  releasePortConnection(origin: Port) {
    this.sendAction({ type: 'release port connection', origin });
  }

  connectPorts(droppedOn: Port, from: Port) {
    this.sendAction({ type: 'connect port', droppedOn, from });
  }

  disconnectPorts(output: OutputPort, input: InputPort) {
    this.sendAction({ type: 'disconnect port', output, input });
  }
}
