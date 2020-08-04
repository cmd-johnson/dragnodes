import { Input, GraphNode, GraphNodeType, Output, Pos, GraphValueType, GraphNodeData } from './graph-node';
import { map } from 'rxjs/operators';
import { deserialize, serialize } from './graph-serialization';
import { BoolVarGraphNode } from './nodes/bool-var-graph-node';
import { NumVarGraphNode } from './nodes/num-var-graph-node';
import { IfGraphNode } from './nodes/if-graph-node';
import { SumGraphNode } from './nodes/sum-graph-node';

describe('Graph Serialization', () => {
  beforeEach(() => {

  });

  it('can deserialize empty graphs', () => {
    /* When */
    const deserialized = deserialize([]);

    /* Then */
    expect(deserialized).toEqual([]);
  });

  it('can deserialize every type of node', () => {
    /* Given */
    const serialized: GraphNodeData<any>[] = [
      { type: 'boolvar' },
      { type: 'numvar' },
      { type: 'if' },
      { type: 'sum' }
    ];

    /* When */
    const deserialized = deserialize(serialized);

    /* Then */
    expect(deserialized.length).toBe(4);
    const [bool, num, ifThenElse, sum] = deserialized as [BoolVarGraphNode, NumVarGraphNode, IfGraphNode, SumGraphNode];
    expect(bool).toBeInstanceOf(BoolVarGraphNode);
    expect(bool.position).toEqual({ x: 0, y: 0 });
    expect(bool.value).toBeNull();
    expect(bool.input.connectedTo).toBeNull();
    expect(bool.output.connectedTo).toBeNull();

    expect(num).toBeInstanceOf(NumVarGraphNode);
    expect(num.position).toEqual({ x: 0, y: 0 });
    expect(num.value).toBeNull();
    expect(num.input.connectedTo).toBeNull();
    expect(num.output.connectedTo).toBeNull();

    expect(ifThenElse).toBeInstanceOf(IfGraphNode);
    expect(ifThenElse.position).toEqual({ x: 0, y: 0 });
    expect(ifThenElse.condition.connectedTo).toBeNull();
    expect(ifThenElse.ifTrue.connectedTo).toBeNull();
    expect(ifThenElse.ifFalse.connectedTo).toBeNull();
    expect(ifThenElse.output.connectedTo).toBeNull();

    expect(sum).toBeInstanceOf(SumGraphNode);
    expect(sum.position).toEqual({ x: 0, y: 0 });
    expect(sum.inputA.connectedTo).toBeNull();
    expect(sum.inputB.connectedTo).toBeNull();
    expect(sum.output.connectedTo).toBeNull();
  });

  it('correctly deserializes node positions', () => {
    /* Given */
    const serialized: GraphNodeData<any>[] = [
      { type: 'boolvar', position: { x: 1, y: 2 } },
      { type: 'numvar', position: { x: 3, y: 4 } },
      { type: 'if', position: { x: 5, y: 6 } },
      { type: 'sum', position: { x: 7, y: 8 } }
    ];

    /* When */
    const deserialized = deserialize(serialized);

    /* Then */
    expect(deserialized[0].position).toEqual({ x: 1, y: 2 });
    expect(deserialized[1].position).toEqual({ x: 3, y: 4 });
    expect(deserialized[2].position).toEqual({ x: 5, y: 6 });
    expect(deserialized[3].position).toEqual({ x: 7, y: 8 });
  });

  it('correctly deserializes variable values', () => {
    /* Given */
    const serialized: GraphNodeData<any>[] = [
      { type: 'boolvar', data: { value: true } },
      { type: 'boolvar', data: { value: false } },
      { type: 'numvar', data: { value: 42 } },
      { type: 'numvar', data: { value: 1337 } }
    ];

    /* When */
    const deserialized = deserialize(serialized) as [BoolVarGraphNode, BoolVarGraphNode, NumVarGraphNode, NumVarGraphNode];

    /* Then */
    expect(deserialized[0].value).toBe(true);
    expect(deserialized[1].value).toBe(false);
    expect(deserialized[2].value).toBe(42);
    expect(deserialized[3].value).toBe(1337);
  });

  it('correctly deserializes node connections', () => {
    /* Given */
    const serialized: GraphNodeData<any>[] = [
      { type: 'boolvar' },
      { type: 'numvar' },
      { type: 'numvar' },
      {
        type: 'if',
        inputs: {
          '': [{ connectedTo: { node: 0, group: '', output: 0 } }],
          Branches: [
            { connectedTo: { node: 1, group: '', output: 0 } },
            { connectedTo: { node: 2, group: '', output: 0 } }
          ]
        }
      },
      { type: 'numvar' },
      {
        type: 'sum',
        inputs: {
          '': [
            { connectedTo: { node: 3, group: '', output: 0 } },
            { connectedTo: { node: 4, group: '', output: 0 } }
          ]
        }
      },
      {
        type: 'numvar',
        inputs: {
          '': [{ connectedTo: { node: 5, group: '', output: 0 } }]
        }
      }
    ];

    /* When */
    const deserialized = deserialize(serialized);

    /* Then */
    expect(deserialized.length).toBe(7);
    const condition = deserialized[0] as BoolVarGraphNode;
    const ifTrue = deserialized[1] as NumVarGraphNode;
    const ifFalse = deserialized[2] as NumVarGraphNode;
    const ifThenElse = deserialized[3] as IfGraphNode;
    const sumInput = deserialized[4] as NumVarGraphNode;
    const sum = deserialized[5] as SumGraphNode;
    const result = deserialized[6] as NumVarGraphNode;

    expect(condition.output.connectedTo).toBe(ifThenElse.condition);
    expect(ifThenElse.condition.connectedTo).toBe(condition.output);

    expect(ifTrue.output.connectedTo).toBe(ifThenElse.ifTrue);
    expect(ifThenElse.ifTrue).toBe(ifTrue.output.connectedTo);

    expect(ifFalse.output.connectedTo).toBe(ifThenElse.ifFalse);
    expect(ifThenElse.ifFalse.connectedTo).toBe(ifFalse.output);

    expect(ifThenElse.output.connectedTo).toBe(sum.inputA);
    expect(sum.inputA.connectedTo).toBe(ifThenElse.output);

    expect(sumInput.output.connectedTo).toBe(sum.inputB);
    expect(sum.inputB.connectedTo).toBe(sumInput.output);

    expect(sum.output.connectedTo).toBe(result.input);
    expect(result.input.connectedTo).toBe(sum.output);

    /* When */
    condition.value = true;
    ifTrue.value = 4;
    ifFalse.value = 2;
    sumInput.value = 6;
    /* Then */
    expect(result.value).toBe(10);

    /* When */
    condition.value = false;
    /* Then */
    expect(result.value).toBe(8);
  });

  it('defaults invalid positions to (0, 0)', () => {
    /* Given */
    const serialized: GraphNodeData<any>[] = [
      { type: 'boolvar', position: { } },
      { type: 'boolvar', position: { x: 'invalid', y: 13 } as any },
      { type: 'boolvar', position: { x: 37, y: 'invalid' } as any }
    ];

    /* When */
    const deserialized = deserialize(serialized);

    /* Then */
    expect((deserialized[0] as BoolVarGraphNode).position).toEqual({ x: 0, y: 0 });
    expect((deserialized[1] as BoolVarGraphNode).position).toEqual({ x: 0, y: 13 });
    expect((deserialized[2] as BoolVarGraphNode).position).toEqual({ x: 37, y: 0 });
  });

  it('ignores invalid node data when deserializing', () => {
    /* Given */
    const serialized: GraphNodeData<any>[] = [
      { type: 'boolvar', data: 'invalid' },
      { type: 'boolvar', data: { } },
      { type: 'boolvar', data: { value: 'invalid' } },
      { type: 'boolvar', data: { value: { } } },
      { type: 'boolvar', data: { value: 42 } },
      { type: 'numvar', data: 'invalid' },
      { type: 'numvar', data: { } },
      { type: 'numvar', data: { value: 'invalid' } },
      { type: 'numvar', data: { value: { } } },
      { type: 'numvar', data: { value: true }}
    ];

    /* When */
    const deserialized = deserialize(serialized);

    /* Then */
    expect((deserialized[0] as BoolVarGraphNode).value).toBeNull();
    expect((deserialized[1] as BoolVarGraphNode).value).toBeNull();
    expect((deserialized[2] as BoolVarGraphNode).value).toBeNull();
    expect((deserialized[3] as BoolVarGraphNode).value).toBeNull();
    expect((deserialized[4] as BoolVarGraphNode).value).toBeNull();
    expect((deserialized[5] as NumVarGraphNode).value).toBeNull();
    expect((deserialized[6] as NumVarGraphNode).value).toBeNull();
    expect((deserialized[7] as NumVarGraphNode).value).toBeNull();
    expect((deserialized[8] as NumVarGraphNode).value).toBeNull();
    expect((deserialized[9] as NumVarGraphNode).value).toBeNull();
  });

  it('ignores invalid inputs when deserializing connections', () => {
    /* Given */
    const serialized: GraphNodeData<any>[] = [
      { // Input group is not an array
        type: 'boolvar', inputs: {
          '': 'invalid' as any
        }
      },
      { // Invalid input group
        type: 'boolvar', inputs: {
          invalid: [{ connectedTo: { node: 1, group: '', output: 0 } }]
        }
      },
      { // Invalid input count (2 instead of only 1)
        type: 'boolvar', inputs: {
          '': [null, { connectedTo: { node: 0, group: '', output: 0 } }]
        }
      },
      { // connectedTo missing
        type: 'boolvar', inputs: {
          '': [{ }]
        }
      },
      { // connectedTo has invalid type
        type: 'boolvar', inputs: {
          '': [{ connectedTo: true as any }]
        }
      },
      { // Invalid nodeId type
        type: 'boolvar', inputs: {
          '': [{ connectedTo: { node: 'invalid', group: '', output: 0 } }]
        }
      },
      { // Non-existant nodeId
        type: 'boolvar', inputs: {
          '': [{ connectedTo: { node: 42, group: '', output: 0 } }]
        }
      },
      { // Invalid group name type
        type: 'boolvar', inputs: {
          '': [{ connectedTo: { node: 0, group: 1234, output: 0 } }]
        }
      },
      { // Non-existant group name
        type: 'boolvar', inputs: {
          '': [{ connectedTo: { node: 0, group: 'invalid', output: 0 } }]
        }
      },
      { // Invalid outputId type
        type: 'boolvar', inputs: {
          '': [{ connectedTo: { node: 0, group: '', output: true } }]
        }
      },
      { // Non-existant outputId
        type: 'boolvar', inputs: {
          '': [{ connectedTo: { node: 0, group: '', output: 123 } }]
        }
      },
      { // Invalid port type
        type: 'numvar', inputs: {
          '': [{ connectedTo: { node: 0, group: '', output: 0 } }]
        }
      }
    ];

    /* When */
    const deserialized = deserialize(serialized);

    /* Then */
    expect((deserialized[0] as BoolVarGraphNode).input.connectedTo).toBeNull();
    expect((deserialized[1] as BoolVarGraphNode).input.connectedTo).toBeNull();
    expect((deserialized[2] as BoolVarGraphNode).input.connectedTo).toBeNull();
    expect((deserialized[3] as BoolVarGraphNode).input.connectedTo).toBeNull();
    expect((deserialized[4] as BoolVarGraphNode).input.connectedTo).toBeNull();
    expect((deserialized[5] as BoolVarGraphNode).input.connectedTo).toBeNull();
    expect((deserialized[6] as BoolVarGraphNode).input.connectedTo).toBeNull();
    expect((deserialized[7] as BoolVarGraphNode).input.connectedTo).toBeNull();
    expect((deserialized[8] as BoolVarGraphNode).input.connectedTo).toBeNull();
    expect((deserialized[9] as BoolVarGraphNode).input.connectedTo).toBeNull();
    expect((deserialized[10] as BoolVarGraphNode).input.connectedTo).toBeNull();
    expect((deserialized[11] as NumVarGraphNode).input.connectedTo).toBeNull();
  });

  it('returns an empty array when deserializing something that is not an array', () => {
    /* When */
    const deserialized = deserialize({ test: 'whatever' });

    /* Then */
    expect(deserialized.length).toBe(0);
  });

  it('correctly serializes unconfigured nodes', () => {
    /* Given */
    const deserialized = [
      new NumVarGraphNode(),
      new BoolVarGraphNode(),
      new IfGraphNode(),
      new SumGraphNode()
    ];

    /* When */
    const serialized = serialize(deserialized);

    /* Then */
    expect(serialized).toEqual([
      {
        type: 'numvar',
        position: { x: 0, y: 0 },
        inputs: { '': [null] },
        data: { value: null }
      },
      {
        type: 'boolvar',
        position: { x: 0, y: 0 },
        inputs: { '': [null] },
        data: { value: null }
      },
      {
        type: 'if',
        position: { x: 0, y: 0 },
        inputs: {
          '': [null],
          Branches: [null, null]
        }
      },
      {
        type: 'sum',
        position: { x: 0, y: 0 },
        inputs: { '': [null, null] }
      }
    ]);
  });

  it('correctly serializes node positions', () => {
    /* Given */
    const deserialized = [
      new NumVarGraphNode({ x: 1, y: 2 }),
      new BoolVarGraphNode({ x: 3, y: 4 }),
      new IfGraphNode({ x: 5, y: 6 }),
      new SumGraphNode({ x: 7, y: 8 })
    ];

    /* When */
    const serialized = serialize(deserialized);

    /* Then */
    expect(serialized.length).toBe(4);
    expect(serialized[0].position).toEqual({ x: 1, y: 2 });
    expect(serialized[1].position).toEqual({ x: 3, y: 4 });
    expect(serialized[2].position).toEqual({ x: 5, y: 6 });
    expect(serialized[3].position).toEqual({ x: 7, y: 8 });
  });

  it('correctly serializes connections', () => {
    /* Given */
    const condition = new BoolVarGraphNode();
    const ifTrue = new NumVarGraphNode();
    const ifFalse = new NumVarGraphNode();
    const ifThenElse = new IfGraphNode();
    const sumInput = new NumVarGraphNode();
    const sum = new SumGraphNode();
    const result = new NumVarGraphNode();

    condition.output.connectPortTo(ifThenElse.condition);
    ifTrue.output.connectPortTo(ifThenElse.ifTrue);
    ifFalse.output.connectPortTo(ifThenElse.ifFalse);
    ifThenElse.output.connectPortTo(sum.inputA);
    sumInput.output.connectPortTo(sum.inputB);
    sum.output.connectPortTo(result.input);

    const deserialized = [condition, ifTrue, ifFalse, ifThenElse, sumInput, sum, result];

    /* When */
    const serialized = serialize(deserialized);

    /* Then */
    expect(serialized).toEqual([
      {
        type: 'boolvar',
        inputs: { '': [null] },
        data: { value: null },
        position: { x: 0, y: 0 }
      },
      {
        type: 'numvar',
        inputs: { '': [null] },
        data: { value: null },
        position: { x: 0, y: 0 }
      },
      {
        type: 'numvar',
        inputs: { '': [null] },
        data: { value: null },
        position: { x: 0, y: 0 }
      },
      {
        type: 'if',
        inputs: {
          '': [{ connectedTo: { node: 0, group: '', output: 0 }}],
          Branches: [
            { connectedTo: { node: 1, group: '', output: 0 } },
            { connectedTo: { node: 2, group: '', output: 0 } }
          ]
        },
        position: { x: 0, y: 0 }
      },
      {
        type: 'numvar',
        inputs: { '': [null] },
        data: { value: null },
        position: { x: 0, y: 0 }
      },
      {
        type: 'sum',
        inputs: { '': [
          { connectedTo: { node: 3, group: '', output: 0 } },
          { connectedTo: { node: 4, group: '', output: 0 } }
        ] },
        position: { x: 0, y: 0 }
      },
      {
        type: 'numvar',
        inputs: { '': [{ connectedTo: { node: 5, group: '', output: 0 } }] },
        data: { value: null },
        position: { x: 0, y: 0 }
      }
    ]);
  });
});
