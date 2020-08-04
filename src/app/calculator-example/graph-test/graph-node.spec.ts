import { Input, GraphNode, GraphNodeType, Output, Pos, GraphValueType } from './graph-node';
import { map } from 'rxjs/operators';

class TestGraphNode<I, O = I> extends GraphNode {
  title = 'test';
  nodeType: GraphNodeType = 'test' as any;

  input: Input<I>;
  output: Output<O>;

  constructor(position?: Pos, inputType: GraphValueType = 'num', outputType: GraphValueType = 'num') {
    super(position);

    const [input] = this.setInputs({ type: inputType, title: 'TestInput' });
    this.input = input;

    const [output] = this.setOutputs({ type: outputType, title: 'TestOutput' });
    this.output = output;
  }

  toString() {
    return this.title;
  }
}

class MultiPortTestGraphNode extends GraphNode {
  title = 'multiport test';
  nodeType: GraphNodeType = 'multiport' as any;

  readonly boolInputs: Input<boolean>[];
  readonly numInputs: Input<number>[];
  readonly boolOutputs: Output<boolean>[];
  readonly numOutputs: Output<number>[];

  constructor() {
    super();

    this.setInputGroups({
      boolean: [
        { type: 'bool', title: 'boolean1' },
        { type: 'bool', title: 'boolean2' }
      ],
      number: [
        { type: 'num', title: 'number1' },
        { type: 'num', title: 'number2' }
      ]
    });
    this.boolInputs = this.inputs.get('boolean') as Input<boolean>[];
    this.numInputs = this.inputs.get('number') as Input<number>[];

    this.setOutputGroups({
      boolean: [
        { type: 'bool', title: 'boolean1' },
        { type: 'bool', title: 'boolean2' }
      ],
      number: [
        { type: 'num', title: 'number1' },
        { type: 'num', title: 'number2' }
      ]
    });
    this.boolOutputs = this.outputs.get('boolean') as Output<boolean>[];
    this.numOutputs = this.outputs.get('number') as Output<number>[];
  }
}

describe('Ports', () => {
  let node: TestGraphNode<number>;
  let input: Input<number>;
  let output: Output<number>;

  beforeEach(() => {
    node = new TestGraphNode<number>(undefined, 'num');
    input = node.input;
    output = node.output;
  });

  it('should be created', () => {
    expect([...node.inputs.entries()]).toEqual([['', [input]]]);
    expect(input).toBeInstanceOf(Input);
    expect(input.node).toBe(node);
    expect(input.group).toBe('');
    expect(input.portType).toBe('input');
    expect(input.title).toBe('TestInput');
    expect(input.type).toBe('num');
    expect(input.connectedTo).toBeNull();

    expect([...node.outputs.entries()]).toEqual([['', [output]]]);
    expect(output).toBeInstanceOf(Output);
    expect(output.node).toBe(node);
    expect(output.group).toBe('');
    expect(output.portType).toBe('output');
    expect(output.title).toBe('TestOutput');
    expect(output.type).toBe('num');
    expect(output.connectedTo).toBeNull();
  });

  it('inputs can not be connected to outputs of a different type', () => {
    /* Given */
    const boolNode = new TestGraphNode<boolean>(undefined, 'bool', 'bool');
    const boolOut: Output<any> = boolNode.output;

    /* When */
    expect(() => input.connectPortTo(boolOut))
      /* Then */
      .toThrowError(Error);
  });

  it('outputs can not be connected to inputs of a different type', () => {
    /* Given */
    const boolNode = new TestGraphNode<boolean>(undefined, 'bool', 'bool');
    const boolIn: Input<any> = boolNode.input;

    /* When */
    expect(() => output.connectPortTo(boolIn))
      /* Then */
      .toThrowError(Error);
  });

  it('can not be connected if one of the ports is already connected', () => {
    /* Given */
    const input1 = new TestGraphNode<number>(undefined, 'num').input;
    const input2 = new TestGraphNode<number>(undefined, 'num').input;
    const output1 = new TestGraphNode<number>(undefined, 'num', 'num').output;
    const output2 = new TestGraphNode<number>(undefined, 'num', 'num').output;

    input.connectPortTo(output1);
    output.connectPortTo(input1);

    /* When */
    expect(() => input.connectPortTo(output2))
      /* Then */
      .toThrowError(Error);
    expect(input.connectedTo).toBe(output1);
    expect(output2.connectedTo).toBeNull();

    /* When */
    expect(() => output2.connectPortTo(input))
      /* Then */
      .toThrowError(Error);
    expect(input.connectedTo).toBe(output1);
    expect(output2.connectedTo).toBeNull();

    /* When */
    expect(() => output.connectPortTo(input2))
      /* Then */
      .toThrowError(Error);
    expect(output.connectedTo).toBe(input1);
    expect(input2.connectedTo).toBeNull();

    /* When */
    expect(() => input2.connectPortTo(output))
      /* Then */
      .toThrowError(Error);
    expect(output.connectedTo).toBe(input1);
    expect(input2.connectedTo).toBeNull();
  });

  it('can not connect inputs to an output of the same node', () => {
    /* When */
    expect(() => input.connectPortTo(node.output))
      /* Then */
      .toThrowError(Error);
  });

  it('can not connect outputs to an input of the same node', () => {
    /* When */
    expect(() => output.connectPortTo(node.input))
      /* Then */
      .toThrowError(Error);
  });

  it('can not be connected if the connection would introduce a cycle in the graph', () => {
    /* Given */
    const node1 = new TestGraphNode<number>(undefined, 'num', 'num');
    node1.title = 'node1';
    const node2 = new TestGraphNode<number>(undefined, 'num', 'num');
    node2.title = 'node2';
    node.output.connectPortTo(node1.input);
    node1.output.connectPortTo(node2.input);
    expect(node1.output.connectedTo).toBe(node2.input);
    expect(node2.input.connectedTo).toBe(node1.output);
    expect(node1.input.connectedTo).toBe(node.output);
    expect(node.output.connectedTo).toBe(node1.input);

    /* When */
    expect(() => input.connectPortTo(node2.output))
      /* Then */
      .toThrowError(Error);

    /* When */
    expect(() => output.connectPortTo(node2.input))
      /* Then */
      .toThrowError(Error);
  });

  it('can be connected to outputs of same type when not introducing cycles', () => {
    /* Given */
    const numNode = new TestGraphNode<number>();
    const numOut = numNode.output;

    /* When */
    expect(() => input.connectPortTo(numOut))
      /* Then */
      .not.toThrowError();
    expect(input.connectedTo).toBe(numOut);
    expect(numOut.connectedTo).toBe(input);
  });

  it('can disconnect', () => {
    /* Given */
    const input1 = new TestGraphNode<number>().input;
    const output1 = new TestGraphNode<number>().output;

    input.connectPortTo(output1);
    expect(input.connectedTo).toBe(output1);
    expect(output1.connectedTo).toBe(input);
    output.connectPortTo(input1);
    expect(output.connectedTo).toBe(input1);
    expect(input1.connectedTo).toBe(output);

    /* When */
    input.disconnectPort();

    /* Then */
    expect(input.connectedTo).toBeNull();
    expect(output1.connectedTo).toBeNull();

    /* When */
    output.disconnectPort();

    /* Then */
    expect(output.connectedTo).toBeNull();
    expect(input1.connectedTo).toBeNull();
  });

  it('does nothing when disconnecting without being connected first', () => {
    /* When */
    input.disconnectPort();
    output.disconnectPort();

    /* Then */
    expect(input.connectedTo).toBeNull();
    expect(output.connectedTo).toBeNull();
  });
});

describe('GraphNode', () => {
  let node: MultiPortTestGraphNode;

  beforeEach(() => {
    node = new MultiPortTestGraphNode();
  });

  it('can create nodes with multiple input and output groups', () => {
    expect(node.title).toBe('multiport test');
    expect(node.position).toEqual({ x: 0, y: 0 });
    expect(node.nodeType).toBe('multiport');
    expect(node.inputs.size).toBe(2);
    expect(node.inputs.get('boolean').length).toBe(2);
    expect(node.inputs.get('boolean')[0]).toBe(node.boolInputs[0]);
    expect(node.inputs.get('boolean')[1]).toBe(node.boolInputs[1]);
    expect(node.inputs.get('number').length).toBe(2);
    expect(node.inputs.get('number')[0]).toBe(node.numInputs[0]);
    expect(node.inputs.get('number')[1]).toBe(node.numInputs[1]);
    expect(node.outputs.size).toBe(2);
    expect(node.outputs.get('boolean').length).toBe(2);
    expect(node.outputs.get('boolean')[0]).toBe(node.boolOutputs[0]);
    expect(node.outputs.get('boolean')[1]).toBe(node.boolOutputs[1]);
    expect(node.outputs.get('number').length).toBe(2);
    expect(node.outputs.get('number')[0]).toBe(node.numOutputs[0]);
    expect(node.outputs.get('number')[1]).toBe(node.numOutputs[1]);
  });

  it('can route inputs to outputs', () => {
    /* Given */
    node.numInputs[0].$value.pipe(map(x => typeof(x) === 'number' ? x + 1 : x)).subscribe(node.numOutputs[0].$value);
    const numInput = new TestGraphNode<number>().input;
    const numOutput = new TestGraphNode<number>().output;
    node.numInputs[0].connectPortTo(numOutput);
    node.numOutputs[0].connectPortTo(numInput);
    const numbers: number[] = [];
    numInput.$value.subscribe(n => numbers.push(n));

    node.boolInputs[0].$value.pipe(map(x => typeof(x) === 'boolean' ? !x : x)).subscribe(node.boolOutputs[0].$value);
    const boolInput = new TestGraphNode<boolean>(undefined, 'bool').input;
    const boolOutput = new TestGraphNode<boolean>(undefined, undefined, 'bool').output;
    node.boolInputs[0].connectPortTo(boolOutput);
    node.boolOutputs[0].connectPortTo(boolInput);
    const booleans: boolean[] = [];
    boolInput.$value.subscribe(b => booleans.push(b));

    /* When */
    numOutput.$value.next(41);
    numOutput.$value.next(1336);
    numOutput.$value.next(6);
    numOutput.disconnectPort();

    boolOutput.$value.next(false);
    boolOutput.$value.next(true);
    boolOutput.$value.next(true);
    boolOutput.$value.next(false);
    boolOutput.disconnectPort();

    /* Then */
    expect(numbers).toEqual([null, 42, 1337, 7, null]);
    expect(booleans).toEqual([null, true, false, false, true, null]);
  });

  it('doesn\'t do anything when calling deserializeNodeData by default', () => {
    expect(() => node.deserializeNodeData(undefined)).not.toThrow();
  });
});
