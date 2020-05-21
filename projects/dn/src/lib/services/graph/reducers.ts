import { Port, GraphNode, InputPort, OutputPort, isSameNode, isSamePort } from '../../data/graph-types';
import { GraphState } from './graph.service';
import {
  GraphAction,
  AddNodeAction, RemoveNodeAction, MoveNodeAction,
  DragPortConnectionAction, ReleasePortConnectionAction,
  ConnectPortAction, DisconnectPortAction
} from './graph-actions';

interface GraphStateReducer<N extends GraphAction['type']> {
  filter: N;
  reducer(state: GraphState, action: Readonly<Extract<GraphAction, { type: N }>>, ): GraphState;
}

type Distribute<U> = U extends GraphAction['type'] ? GraphStateReducer<U> : never;
type AnyReducer = Distribute<GraphAction['type']>;

export const reducers: AnyReducer[] = [
  {
    filter: 'add node',
    reducer(state: GraphState, action: AddNodeAction) {
      state.nodes.push(action.node);
      return state;
    }
  },
  {
    filter: 'remove node',
    reducer(state: GraphState, action: RemoveNodeAction) {
      const index = state.nodes.findIndex(n => isSameNode(n, action.node));
      state.nodes.splice(index, 1);
      state.connections = state.connections.filter(({ from, to }) =>
        !isSameNode(from.parent, action.node) && !isSameNode(to.parent, action.node)
      );
      action.node.inputs.forEach(i => state.draggedConnections.delete(i));
      action.node.outputs.forEach(o => state.draggedConnections.delete(o));
      return state;
    }
  },
  {
    filter: 'move node',
    reducer(state: GraphState, action: MoveNodeAction) {
      const index = state.nodes.findIndex(n => isSameNode(n, action.node));
      state.nodes[index].position = action.position;
      return state;
    }
  },
  {
    filter: 'drag port connection',
    reducer(state: GraphState, action: DragPortConnectionAction) {
      if (state.draggedConnections.has(action.origin)) {
        // It's not the first drag event for the connection and the drag started at a not yet connected port
        state.draggedConnections.set(action.origin, action.cursor);
      } else if (state.detachedDraggedConnections.has(action.origin)) {
        // It's not the first drag event for the connection and the drag started at an already connected port
        const { remainingOrigin, released } = state.detachedDraggedConnections.get(action.origin);
        if (released) {
          state.detachedDraggedConnections.delete(action.origin);
          state.draggedConnections.set(action.origin, action.cursor);
        } else {
          state.detachedDraggedConnections.set(action.origin, { remainingOrigin, cursorPosition: action.cursor, released: false });
        }
      } else if (state.connections.some(({ from, to }) => isSamePort(from, action.origin) || isSamePort(to, action.origin))) {
        // It's a new drag started from an already connected port
        const pairIndex = state.connections.findIndex(({ from, to }) => isSamePort(from, action.origin) || isSamePort(to, action.origin));
        const pair = state.connections[pairIndex];

        state.connections.splice(pairIndex, 1);
        //this.disconnectPorts(pair.from, pair.to);

        const other = isSamePort(action.origin, pair.from) ? pair.to : pair.from;
        state.detachedDraggedConnections.set(action.origin, { remainingOrigin: other, cursorPosition: action.cursor, released: false });
      } else {
        // It's a new drag started from a not yet connected port
        state.draggedConnections.set(action.origin, action.cursor);
      }
      return state;
    }
  },
  {
    filter: 'release port connection',
    reducer(state: GraphState, action: ReleasePortConnectionAction) {
      //console.log(action);
      state.draggedConnections.delete(action.origin);
      if (state.detachedDraggedConnections.has(action.origin)) {
        state.detachedDraggedConnections.get(action.origin).released = true;
      }
      return state;
    }
  },
  {
    filter: 'connect port',
    reducer(state: GraphState, action: ConnectPortAction) {
      if (isSameNode(action.droppedOn.parent, action.from.parent)) {
        const detached = state.detachedDraggedConnections.get(action.droppedOn) || state.detachedDraggedConnections.get(action.from);

        console.log(action, [...state.detachedDraggedConnections.entries()]);
        if (detached) {
          const other = detached.remainingOrigin;
          if (other instanceof InputPort && action.droppedOn instanceof OutputPort) {
            state.connections.push({ from: action.droppedOn, to: other });
          } else if (other instanceof OutputPort && action.droppedOn instanceof InputPort) {
            state.connections.push({ from: other, to: action.droppedOn });
          }
        }
      } else if (!state.connections.some(({ from, to }) => isSamePort(from, action.droppedOn) || isSamePort(to, action.from))) {
        if (action.droppedOn instanceof InputPort && action.from instanceof OutputPort) {
          state.connections.push({ from: action.from, to: action.droppedOn });
        } else if (action.droppedOn instanceof OutputPort && action.from instanceof InputPort) {
          state.connections.push({ from: action.droppedOn, to: action.from });
        }
      }
      return state;
    }
  },
  /*{
    filter: 'disconnect port',
    reducer(state: GraphState, action: DisconnectPortAction) {
      const index = state.connections.findIndex(({ from, to }) => isSamePort(from, action.output) && isSamePort(to, action.input));
      if (index >= 0) {
        state.connections.splice(index, 1);
      }
      return state;
    }
  }*/
];
