import { IfGraphNode } from './if-graph-node';
import { NumVarGraphNode } from './num-var-graph-node';
import { BoolVarGraphNode } from './bool-var-graph-node';

describe('IfGraphNode', () => {
  let node: IfGraphNode;

  beforeEach(() => {
    node = new IfGraphNode();
  });

  it('should be created', () => {
    expect(node).toBeInstanceOf(IfGraphNode);
    expect(node.title).toBe('If Then Else');
    expect(node.inputs.get('')[0]).toBe(node.condition);
    expect(node.inputs.get('Branches')[0]).toBe(node.ifTrue);
    expect(node.inputs.get('Branches')[1]).toBe(node.ifFalse);
    expect(node.outputs.get('')[0]).toBe(node.output);
  });

  it('outputs null when no input is attached', () => {
    /* When */
    const result = new NumVarGraphNode();
    node.output.connectPortTo(result.input);

    /* Then */
    expect(result.value).toBeNull();
  });

  it('outputs null when both branches are connected but the condition is null', () => {
    /* Given */
    const trueBranch = new NumVarGraphNode();
    trueBranch.value = 1;
    const falseBranch = new NumVarGraphNode();
    falseBranch.value = 2;
    const result = new NumVarGraphNode();
    node.output.connectPortTo(result.input);

    /* When */
    trueBranch.output.connectPortTo(node.ifTrue);
    falseBranch.output.connectPortTo(node.ifFalse);

    /* Then */
    expect(result.value).toBeNull();
  });

  it('outputs the value of the `true` input when the condition is true', () => {
    /* Given */
    const trueBranch = new NumVarGraphNode();
    const falseBranch = new NumVarGraphNode();
    const condition = new BoolVarGraphNode();
    const result = new NumVarGraphNode();
    node.output.connectPortTo(result.input);
    trueBranch.output.connectPortTo(node.ifTrue);
    falseBranch.output.connectPortTo(node.ifFalse);
    condition.output.connectPortTo(node.condition);

    /* When */
    trueBranch.value = 1;
    falseBranch.value = 2;
    /* Then */
    expect(result.value).toBeNull();

    /* When */
    condition.value = true;
    /* Then */
    expect(result.value).toBe(1);

    /* When */
    trueBranch.value = 10;
    /* Then */
    expect(result.value).toBe(10);
  });

  it('outputs the value of the `false` input when the condition is false', () => {
    /* Given */
    const trueBranch = new NumVarGraphNode();
    const falseBranch = new NumVarGraphNode();
    const condition = new BoolVarGraphNode();
    const result = new NumVarGraphNode();
    node.output.connectPortTo(result.input);
    trueBranch.output.connectPortTo(node.ifTrue);
    falseBranch.output.connectPortTo(node.ifFalse);
    condition.output.connectPortTo(node.condition);

    /* When */
    trueBranch.value = 1;
    falseBranch.value = 2;
    /* Then */
    expect(result.value).toBeNull();

    /* When */
    condition.value = false;
    /* Then */
    expect(result.value).toBe(2);

    /* When */
    falseBranch.value = 20;
    /* Then */
    expect(result.value).toBe(20);
  });


  it('deserializes correctly', () => {
    expect(node.serializeNodeData()).toBeUndefined();
  });
});
