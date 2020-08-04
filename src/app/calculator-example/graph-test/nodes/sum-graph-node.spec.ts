import { SumGraphNode } from './sum-graph-node';
import { NumVarGraphNode } from './num-var-graph-node';

describe('SumGraphNode', () => {
  let node: SumGraphNode;

  beforeEach(() => {
    node = new SumGraphNode();
  });

  it('should be created', () => {
    expect(node).toBeInstanceOf(SumGraphNode);
    expect(node.title).toBe('Sum');
    expect(node.inputs.get('')[0]).toBe(node.inputA);
    expect(node.inputs.get('')[1]).toBe(node.inputB);
    expect(node.outputs.get('')[0]).toBe(node.output);
  });

  it('calculates the sum of both inputs', () => {
    /* When */
    const result = new NumVarGraphNode();
    result.input.connectPortTo(node.output);
    /* Then */
    expect(result.value).toBeNull();

    /* When */
    const nodeA = new NumVarGraphNode();
    nodeA.output.connectPortTo(node.inputA);
    /* Then */
    expect(result.value).toBeNull();

    /* When */
    nodeA.value = 42;
    /* Then */
    expect(result.value).toBe(42);

    /* When */
    const nodeB = new NumVarGraphNode();
    nodeB.output.connectPortTo(node.inputB);
    /* Then */
    expect(result.value).toBe(42);

    /* When */
    nodeB.value = 1337;
    /* Then */
    expect(result.value).toBe(1379);

    /* When */
    nodeA.value = null;
    /* Then */
    expect(result.value).toBe(1337);
  });

  it('deserializes correctly', () => {
    expect(node.serializeNodeData()).toBeUndefined();
  });
});
