import { InputPort, OutputPort, isSameNode, isSamePort } from '../../data/graph-types';
import { GraphState } from './graph.service';
import { GraphAction } from './graph-actions';
import { produceWithPatches } from 'immer';

interface GraphStateReducer<N extends GraphAction['type']> {
  filter: N;
  reducer(state: GraphState, action: Readonly<Extract<GraphAction, { type: N }>>);
}

type Distribute<U> = U extends GraphAction['type'] ? GraphStateReducer<U> : never;
type AnyReducer = Distribute<GraphAction['type']>;

export function reduceAction(initialState: GraphState, action: GraphAction): GraphState {
  const [newState, diff] = produceWithPatches(
    initialState,
    draftState => {
      reducers.filter(r => r.filter === action.type).forEach(r => {
        r.reducer(draftState, action as any);
      });
    }
  );
  console.log(`DN: ${action.type} =>`, diff);

  return newState;
}

export const reducers: AnyReducer[] = [
  {
    filter: 'add node',
    reducer(state, action) {
      state.nodes.push(action.node);
    }
  },
  {
    filter: 'remove node',
    reducer(state, action) {
      const index = state.nodes.findIndex(n => isSameNode(n, action.node));
      state.nodes.splice(index, 1);
      state.connections = state.connections.filter(({ output, input }) =>
        !isSameNode(output.parent, action.node) && !isSameNode(input.parent, action.node)
      );
      action.node.inputs.forEach(i => state.draggedConnections.delete(i));
      action.node.outputs.forEach(o => state.draggedConnections.delete(o));
    }
  },
  {
    filter: 'move node',
    reducer(state, action) {
      const nodeIndex = state.nodes.findIndex(n => isSameNode(n, action.node));
      state.nodes[nodeIndex].position = { ...action.position };
    }
  },
  {
    filter: 'drag port connection',
    reducer(state, action) {
      state.draggedConnections.set(action.origin, action.cursor);
    }
  },
  {
    filter: 'release port connection',
    reducer(state, action) {
      state.draggedConnections.delete(action.origin);
    }
  },
  {
    filter: 'connect port',
    reducer(state, action) {
      if (isSameNode(action.output.parent, action.input.parent)) {
        return;
      }
      const fromIsInput = action.output instanceof InputPort;
      const toIsInput = action.input instanceof InputPort;
      if (fromIsInput === toIsInput) {
        return;
      }
      if (state.connections.some(({ output, input }) =>
        isSamePort(output, action.input) || isSamePort(output, action.output) ||
        isSamePort(input, action.input) || isSamePort(input, action.output))
      ) {
        return;
      }

      state.connections.push({
        output: (fromIsInput ? action.input : action.output) as OutputPort,
        input: (fromIsInput ? action.output : action.input) as InputPort
      });
    }
  },
  {
    filter: 'disconnect port',
    reducer(state, action) {
      const index = state.connections.findIndex(
        c => isSamePort(c.output, action.output) && isSamePort(c.input, action.input)
      );
      if (index >= 0) {
        state.connections.splice(index, 1);
      }
    }
  }
];
