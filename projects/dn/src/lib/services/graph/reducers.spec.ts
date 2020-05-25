import { reduceAction } from './reducers';
import { GraphState } from './graph.service';
import { GraphAction } from './graph-actions';
import { enableMapSet, enablePatches } from 'immer';
import { GraphNode, InputPort, OutputPort } from '../../data/graph-types';

fdescribe('GraphService Reducers', () => {
  let initialState: GraphState;

  beforeAll(() => {
    enableMapSet();
    enablePatches();
  });

  beforeEach(() => {
    initialState = {
      nodes: [],
      connections: [],
      draggedConnections: new Map()
    };
  });

  function runAction(action: GraphAction): GraphState {
    return reduceAction(initialState, action);
  }

  function createNode(name = 'TestNode', inputs = 0, outputs = 0): GraphNode {
    const node: GraphNode = {
      name, inputs: [], outputs: [], position: { x: 0, y: 0 }
    };
    for (let i = 0; i < inputs; i++) {
      node.inputs.push(new InputPort(`Input ${i}`, node));
    }
    for (let o = 0; o < outputs; o++) {
      node.outputs.push(new OutputPort(`Output ${o}`, node));
    }
    return node;
  }

  it('adds new nodes', () => {
    /* Given */
    const testNode = createNode();

    /* When */
    const newState = runAction({
      type: 'add node',
      node: testNode
    });

    /* Then */
    expect(newState.nodes.length).toBe(1);
    expect(newState.nodes).toEqual([testNode]);
  });

  it('removes nodes', () => {
    /* Given */
    const testNode = createNode();
    initialState.nodes = [ testNode ];

    /* When */
    const newState = runAction({
      type: 'remove node',
      node: testNode
    });

    /* Then */
    expect(newState.nodes.length).toBe(0);
  });

  it('moves nodes', () => {
    /* Given */
    const testNode = createNode();
    initialState.nodes = [ testNode ];

    /* When */
    const newState = runAction({
      type: 'move node',
      node: testNode,
      position: { x: 13, y: 37 }
    });

    /* Then */
    expect(newState.nodes).toEqual([
      {...testNode, position: { x: 13, y: 37 }}
    ]);
  });

  describe('dragging connections', () => {
    let node1: GraphNode;
    let node2: GraphNode;

    beforeEach(() => {
      node1 = createNode('TestNode1', 2, 2);
      node2 = createNode('TestNode2', 2, 2);
      initialState.nodes = [ node1, node2 ];
    });

    it('drags new connections', () => {
      /* When */
      const newState = runAction({
        type: 'drag port connection',
        origin: node1.outputs[0],
        cursor: { x: 13, y: 37 }
      });

      /* Then */
      expect(newState.draggedConnections.size).toBe(1);
      expect(newState.draggedConnections.get(node1.outputs[0])).toEqual({ x: 13, y: 37 });
    });

    it('continues dragging already dragged connections', () => {
      /* Given */
      initialState.draggedConnections = new Map([
        [ node1.outputs[0], { x: 0, y: 0 } ]
      ]);

      /* When */
      const newState = runAction({
        type: 'drag port connection',
        origin: node1.outputs[0],
        cursor: { x: 13, y: 37 }
      });

      /* Then */
      expect(newState.draggedConnections.size).toBe(1);
      expect(newState.draggedConnections.get(node1.outputs[0])).toEqual({ x: 13, y: 37 });
    });

    it('drags previously established connections', () => {
      /* Given */
      initialState.connections = [
        { output: node1.outputs[0], input: node2.inputs[0] }
      ];

      /* When */
      const newState = runAction({
        type: 'drag port connection',
        origin: node1.outputs[0],
        cursor: { x: 13, y: 37 }
      });

      /* Then */
      expect(newState.draggedConnections.size).toBe(1);
      expect(newState.draggedConnections.get(node1.outputs[0])).toEqual({ x: 13, y: 37 });
    });
  });

  it('removes dragged connections when released', () => {
    /* Given */
    initialState.nodes = [
      createNode('TestNode 1', 2, 2),
      createNode('TestNode 2', 2, 2)
    ];
    initialState.draggedConnections = new Map([
      [initialState.nodes[0].outputs[0], { x: 13, y: 37 }]
    ]);
    initialState.connections = [{
      output: initialState.nodes[0].outputs[0],
      input: initialState.nodes[1].inputs[0]
    }];

    /* When */
    const newState = runAction({
      type: 'release port connection',
      origin: initialState.nodes[0].outputs[0]
    });

    /* Then */
    expect(newState.draggedConnections.size).toBe(0);
  });

  describe('connecting ports', () => {
    beforeEach(() => {
      initialState.nodes = [
        createNode('TestNode 1', 2, 2),
        createNode('TestNode 2', 2, 2)
      ];
    });

    it('connects ports', () => {
      /* When */
      const newState = runAction({
        type: 'connect port',
        input: initialState.nodes[1].inputs[0],
        output: initialState.nodes[0].outputs[0]
      });

      /* Then */
      expect(newState.connections).toEqual([{
        output: initialState.nodes[0].outputs[0],
        input: initialState.nodes[1].inputs[0]
      }]);
    });

    it(`doesn't connect ports twice`, () => {
      /* Given */
      initialState.connections = [{
        output: initialState.nodes[0].outputs[0],
        input: initialState.nodes[1].inputs[1]
      }];

      /* When */
      const newState = runAction({
        type: 'connect port',
        output: initialState.nodes[0].outputs[1],
        input: initialState.nodes[1].inputs[1]
      });

      /* Then */
      expect(newState.connections.length).toBe(1);
      expect(newState.connections).toEqual([{
        output: initialState.nodes[0].outputs[0],
        input: initialState.nodes[1].inputs[1]
      }]);
    });

    it(`doesn't connect ports that belong to the same node`, () => {
      /* When */
      const newState = runAction({
        type: 'connect port',
        output: initialState.nodes[0].outputs[1],
        input: initialState.nodes[0].inputs[0]
      });

      /* Then */
      expect(newState.connections).toEqual([]);
    });
  });

  it('disconnects ports', () => {
    /* Given */
    initialState.nodes = [
      createNode('TestNode 1', 2, 2),
      createNode('TestNode 2', 2, 2)
    ];
    initialState.connections = [{
      output: initialState.nodes[0].outputs[0],
      input: initialState.nodes[1].inputs[0]
    }];

    /* When */
    const newState = runAction({
      type: 'disconnect port',
      output: initialState.nodes[0].outputs[0],
      input: initialState.nodes[1].inputs[0]
    });

    /* Then */
    expect(newState.connections.length).toBe(0);
  });
});
