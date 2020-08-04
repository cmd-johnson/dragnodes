import { NumVarGraphNode } from './num-var-graph-node';

describe('NumVarGraphNode', () => {
  let node: NumVarGraphNode;

  beforeEach(() => {
    node = new NumVarGraphNode();
  });

  it('should be created', () => {
    expect(node).toBeInstanceOf(NumVarGraphNode);
    expect(node.value).toBeNull();
    expect(node.inputs.get('')[0]).toBe(node.input);
    expect(node.outputs.get('')[0]).toBe(node.output);
  });

  it('outputs its value when set directly', () => {
    let v: number;
    node.output.$value.subscribe(o => v = o);

    /* When */
    node.value = 1337;

    /* Then */
    expect(node.value).toBe(1337);
    expect(v).toBe(1337);
  });

  it('deserializes correctly', () => {
    /* Given */
    let lastResult: number;
    node.output.$value.subscribe(v => lastResult = v);

    /* When */
    node.deserializeNodeData({ value: 42 });
    /* Then */
    expect(node.value).toBe(42);
    expect(lastResult).toBe(42);

    /* When */
    node.deserializeNodeData({ value: 1337 });
    /* Then */
    expect(node.value).toBe(1337);
    expect(lastResult).toBe(1337);

    /* When */
    node.deserializeNodeData({});
    /* Then */
    expect(node.value).toBeNull();
    expect(lastResult).toBeNull();
  });

  it('serializes correctly', () => {
    /* Given */
    node.value = 42;
    /* When */
    let serialized = node.serializeNodeData();
    /* Then */
    expect(serialized).toEqual({ value: 42 });

    /* Given */
    node.value = null;
    /* When */
    serialized = node.serializeNodeData();
    /* Then */
    expect(serialized).toEqual({ value: null });

    /* Given */
    const other = new NumVarGraphNode();
    other.output.connectPortTo(node.input);
    /* When */
    other.value = 1337;
    /* Then */
    expect(other.serializeNodeData()).toEqual({ value: 1337 });
  });
});
