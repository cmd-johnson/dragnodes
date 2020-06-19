import { Component, OnDestroy, EventEmitter, Input, QueryList, ContentChildren, AfterContentInit, Output } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { startWith, map, pairwise, takeUntil, scan, tap, throttleTime } from 'rxjs/operators';

import { GraphService } from '../../services/graph/graph.service';
import { ResolvePortService } from '../../services/resolve-port/resolve-port.service';
import { Position } from '../../data/position';
import { PortDragEvent, PortDropEvent, NodePortDirective } from '../../directives/node-port/node-port';
import { NodeDirective } from '../../directives/node/node.directive';

function isEqual<T>(a: T, b: T) {
  return a === b;
}

interface ConnectPortsAction<PortKey> {
  type: 'connect';
  from: PortKey;
  to: PortKey;
}

interface DisconnectPortsAction<PortKey> {
  type: 'disconnect';
  output: PortKey;
  input: PortKey;
}

interface RemovePortAction<PortKey> {
  type: 'remove port';
  port: PortKey;
}

interface SetConnectionsAction<PortKey> {
  type: 'set';
  connections: {
    output: PortKey,
    input: PortKey
  }[];
}

interface StartPortDragAction<PortKey> {
  type: 'start drag';
  origin: PortKey;
  interaction: Interact.Interaction;
}

interface DragPortConnectionAction<PortKey> {
  type: 'drag';
  origin: PortKey;
  cursorClientPosition: Position;
}

interface ReleasePortDragConnectionAction<PortKey> {
  type: 'release';
  origin: PortKey;
}

type ConnectionAction<PortKey>
  = ConnectPortsAction<PortKey>
  | DisconnectPortsAction<PortKey>
  | RemovePortAction<PortKey>
  | SetConnectionsAction<PortKey>
  | StartPortDragAction<PortKey>
  | DragPortConnectionAction<PortKey>
  | ReleasePortDragConnectionAction<PortKey>
  ;

@Component({
  selector: 'dn-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss'],
  providers: [ GraphService, ResolvePortService ]
})
export class GraphComponent<PortKey> implements AfterContentInit, OnDestroy {
  private unsubscribe = new Subject();

  visibleConnections = new EventEmitter<{ from: Position, to: Position }[]>();

  @ContentChildren(NodePortDirective, { descendants: true })
  ports: QueryList<NodePortDirective<PortKey>>;

  private portMap = new Map<PortKey, NodePortDirective<PortKey>>();

  @ContentChildren(NodeDirective, { descendants: true })
  nodes: QueryList<NodeDirective>;

  @Input()
  canConnectPorts: (a: PortKey, b: PortKey) => boolean = (() => true);

  @Input()
  set connections(connections: { output: PortKey, input: PortKey }[]) {
    this.connectionActions.next({ type: 'set', connections });
  }

  @Output()
  portsConnected = new EventEmitter<{ output: PortKey, input: PortKey }>();

  @Output()
  portsDisconnected = new EventEmitter<{ output: PortKey, input: PortKey }>();

  private connectionActions = new Subject<ConnectionAction<PortKey>>();
  private rerenderConnections = new Subject();

  constructor() {
    const initialState: {
      draggedConnections: { origin: PortKey, clientCursorPos?: Position }[],
      connections: { output: PortKey, input: PortKey }[]
    } = {
      draggedConnections: [],
      connections: []
    };

    const connectionState = this.connectionActions.pipe(
      scan((state, action) => {
        switch (action.type) {
          case 'start drag': {
            const existingConnection = state.connections.find(c => isEqual(c.output, action.origin) || isEqual(c.input, action.origin));
            let dragOrigin: PortKey;
            if (existingConnection) {
              setTimeout(() => this.connectionActions.next({ type: 'disconnect', ...existingConnection }));
              dragOrigin = isEqual(action.origin, existingConnection.input) ? existingConnection.output : existingConnection.input;
            } else {
              dragOrigin = action.origin;
            }
            state.draggedConnections.push({
              origin: dragOrigin
            });
            this.getPortDirective(dragOrigin).startDrag(action.interaction);
            break;
          }
          case 'drag': {
            const draggedConnection = {
              origin: action.origin,
              clientCursorPos: action.cursorClientPosition
            };
            const existingDrag = state.draggedConnections.findIndex(c => isEqual(c.origin, action.origin));
            if (existingDrag >= 0) {
              // Ignore drags that have not been started through the 'start drag' action
              state.draggedConnections[existingDrag] = draggedConnection;
            }
            break;
          }
          case 'release': {
            const draggedConnection = state.draggedConnections.findIndex(c => isEqual(c.origin, action.origin));
            if (draggedConnection >= 0) {
              state.draggedConnections.splice(draggedConnection, 1);
            }
            break;
          }
          case 'connect': {
            const a = this.getPortDirective(action.from);
            const b = this.getPortDirective(action.to);
            console.log(action.from, '->', action.to);
            if (a.isInput === b.isInput || a.isOutput === b.isOutput) {
              break; // Cannot connect inputs to inputs or outputs to outputs
            }
            const input = a.isInput ? action.from : action.to;
            const output = a.isOutput ? action.from : action.to;
            if (state.connections.some(c => isEqual(c.input, input) || isEqual(c.output, output))) {
              break; // Ignore the action if one of the ports is already connected to somewhere
            }
            if (!this.canConnectPorts(output, input)) {
              break;
            }
            state.connections.push({ output, input });
            this.portsConnected.next({ output, input });
            break;
          }
          case 'disconnect': {
            const connectionIndex = state.connections.findIndex(c => isEqual(c.input, action.input) && isEqual(c.output, action.output));
            if (connectionIndex < 0) {
              break; // The connection does not exist; ignore the action
            }
            const connection = state.connections.splice(connectionIndex, 1)[0];
            this.portsDisconnected.next(connection);
            break;
          }
          case 'remove port': {
            const connectionIndex = state.connections.findIndex(c => isEqual(c.input, action.port) || isEqual(c.output, action.port));
            if (connectionIndex >= 0) {
              const connection = state.connections.splice(connectionIndex, 1)[0];
              this.portsDisconnected.next(connection);
            }
            break;
          }
        }
        return state;
      }, initialState)
    );

    combineLatest([
      connectionState.pipe(
        map(({ draggedConnections, connections }) => {
          const dragged = draggedConnections.filter(d => !!d.clientCursorPos).map(({ origin, clientCursorPos }) => {
            const originDir = this.getPortDirective(origin);
            if (originDir.isOutput) {
              return { from: originDir.centerPosition, to: { ...clientCursorPos } };
            } else {
              return { from: { ...clientCursorPos }, to: originDir.centerPosition };
            }
          });
          const established = connections.map(({ output, input }) => ({
            from: this.getPortDirective(output).centerPosition,
            to: this.getPortDirective(input).centerPosition
          }));
          return dragged.concat(established);
        })
      ),
      this.rerenderConnections.pipe(
        throttleTime(1 / 60, undefined, { leading: true, trailing: true })
      )
    ]).pipe(
      map(([ connections ]) => connections),
      takeUntil(this.unsubscribe)
    ).subscribe(this.visibleConnections);
  }

  ngAfterContentInit(): void {
    this.ports.changes.pipe(
      tap(() => console.log('ports changed')),
      map(() => this.ports.toArray()),
      startWith([] as NodePortDirective<PortKey>[], this.ports.toArray()),
      pairwise(),
      map(([o, n]) => ({
        added: n.filter(v => !o.some(oldPort => isEqual(v, oldPort))),
        removed: o.filter(v => !n.some(newPort => isEqual(v, newPort)))
      })),
      takeUntil(this.unsubscribe)
    ).subscribe(n => {
      n.added.forEach(port => {
        port.beginInteraction.pipe(
          map(interaction => ({ interaction, port })),
          takeUntil(this.unsubscribe)
        ).subscribe(this.startInputPortDrag.bind(this));

        port.dragEvents.pipe(takeUntil(this.unsubscribe)).subscribe(this.dragInputPort.bind(this));
        port.droppedHere.pipe(takeUntil(this.unsubscribe)).subscribe(this.droppedOnPort.bind(this));

        this.portMap.set(port.trackPortBy, port);
      });

      n.removed.forEach(port => {
        this.connectionActions.next({
          type: 'remove port',
          port: port.trackPortBy
        });

        this.portMap.delete(port.trackPortBy);
      });

      setTimeout(() => this.rerenderConnections.next(), 0);
    });

    this.nodes.changes.pipe(
      tap(() => console.log('nodes changed')),
      map(() => this.nodes.toArray()),
      startWith([] as NodeDirective[], this.nodes.toArray()),
      pairwise(),
      map(([o, n]) => ({
        added: n.filter(v => !o.some(oldNode => isEqual(v, oldNode))),
        removed: o.filter(v => !n.some(newNode => isEqual(v, newNode)))
      })),
      takeUntil(this.unsubscribe)
    ).subscribe(changes => {
      changes.added.forEach(node => {
        node.nodePositionChange.pipe(
          map(() => ({ type: 're-render' })),
          takeUntil(this.unsubscribe)
        ).subscribe(this.connectionActions);
      });
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  startInputPortDrag(data: { interaction: Interact.Interaction, port: NodePortDirective<PortKey> }) {
    this.connectionActions.next({
      type: 'start drag',
      origin: data.port.trackPortBy,
      interaction: data.interaction
    });
    // TODO: check if this port is already connected and if so, start the drag from the port this port is connected to
    // port.startDrag(interaction);
  }

  dragInputPort(event: PortDragEvent<PortKey>) {
    switch (event.type) {
      case 'start':
      case 'drag':
        this.connectionActions.next({
          type: 'drag',
          origin: event.draggedPort,
          cursorClientPosition: event.cursorClientPosition
        });
        break;
      case 'end':
        this.connectionActions.next({
          type: 'release',
          origin: event.draggedPort
        });
    }
  }

  droppedOnPort(event: PortDropEvent<PortKey>) {
    this.connectionActions.next({
      type: 'connect',
      from: event.draggedFrom,
      to: event.droppedOn
    });
  }

  private getPortDirective(key: PortKey): NodePortDirective<PortKey> {
    return this.portMap.get(key);
    // return this.ports.find(p => isEqual(p.trackPortBy, key));
  }
}
