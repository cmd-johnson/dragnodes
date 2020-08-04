import { BoolVarGraphNode } from './bool-var-graph-node';

describe('BoolVarGraphNode', () => {
  let node: BoolVarGraphNode;

  beforeEach(() => {
    node = new BoolVarGraphNode();
  });

  it('should be created', () => {
    expect(node).toBeInstanceOf(BoolVarGraphNode);
    expect(node.value).toBeNull();
    expect(node.inputs.get('')[0]).toBe(node.input);
    expect(node.outputs.get('')[0]).toBe(node.output);
  });

  it('outputs its value when set directly', () => {
    let v: boolean;
    node.output.$value.subscribe(o => v = o);

    /* When */
    node.value = true;

    /* Then */
    expect(node.value).toBeTrue();
    expect(v).toBeTrue();
  });

  it('deserializes correctly', () => {
    /* When */
    node.deserializeNodeData({ value: false });
    /* Then */
    expect(node.value).toBeFalse();

    /* When */
    node.deserializeNodeData({ value: true });
    /* Then */
    expect(node.value).toBeTrue();

    /* When */
    node.deserializeNodeData({});
    /* Then */
    expect(node.value).toBeNull();
  });

  it('serializes correctly', () => {
    /* Given */
    node.value = true;
    /* When */
    let serialized = node.serializeNodeData();
    /* Then */
    expect(serialized).toEqual({ value: true });

    /* Given */
    node.value = null;
    /* When */
    serialized = node.serializeNodeData();
    /* Then */
    expect(serialized).toEqual({ value: null });

    /* Given */
    const other = new BoolVarGraphNode();
    other.output.connectPortTo(node.input);
    /* When */
    other.value = false;
    /* Then */
    expect(other.serializeNodeData()).toEqual({ value: false });
  });
});
