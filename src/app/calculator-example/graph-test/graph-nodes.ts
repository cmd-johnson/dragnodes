import { Input, Output, GraphNodeData, GraphNode, GraphNodeType, Pos } from './graph-node';

class NumVarGraphNode extends GraphNode<{ value?: number }> {
  public readonly nodeType: GraphNodeType = 'numvar';
  public readonly title = 'Number';

  constructor(id: number, position?: Pos) {
    super(
      new Map<string, Input[]>([
        ['', [new Input(null, '', 'num', 'Set', 0)]]
      ]),
      new Map<string, Output[]>([
        ['', [new Output(null, '', 'num', 'Get', 0)]]
      ]), id, position
    );
  }

  serialize(): GraphNodeData<{ value?: number }> {
    return this.serializeCommon({ });
  }
}

class BoolVarGraphNode extends GraphNode<{ value?: boolean }> {
  public readonly nodeType: GraphNodeType = 'boolvar';
  public readonly title = 'Boolean';

  constructor(id: number, position?: Pos) {
    super(
      new Map<string, Input[]>([
        ['', [new Input(null, '', 'bool', 'Set', 0)]]
      ]),
      new Map<string, Output[]>([
        ['', [new Output(null, '', 'bool', 'Get', 0)]]
      ]), id, position
    );
  }

  serialize(): GraphNodeData<{ value?: boolean }> {
    return this.serializeCommon({ });
  }
}

class SumGraphNode extends GraphNode {
  public readonly nodeType: GraphNodeType = 'sum';
  public readonly title = 'Sum';

  constructor(id: number, position?: Pos) {
    super(
      new Map<string, Input[]>([
        ['', [
          new Input(null, '', 'num', 'A', 0),
          new Input(null, '', 'num', 'B', 1)
        ]]
      ]),
      new Map<string, Output[]>([
        ['', [new Output(null, '', 'num', 'Result', 0)]]
      ]), id, position
    );
  }

  serialize(): GraphNodeData<undefined> {
    return this.serializeCommon(undefined);
  }
}

class IfGraphNode extends GraphNode {
  public readonly nodeType: GraphNodeType = 'if';
  public readonly title = 'If Then Else';

  constructor(id: number, position?: Pos) {
    super(
      new Map<string, Input[]>([
        ['', [new Input(null, '', 'bool', 'Condition', 0)]],
        ['Branches', [
          new Input(null, '', 'num', 'True', 0),
          new Input(null, '', 'num', 'False', 1)
        ]]
      ]),
      new Map<string, Output[]>([
        ['', [new Output(null, '', 'num', 'Result', 0)]]
      ]), id, position
    );
  }

  serialize(): GraphNodeData<undefined> {
    return this.serializeCommon(undefined);
  }
}

const nodeConstructors: { readonly [T in GraphNodeType]: new (id: number, pos?: Pos) => GraphNode<any> } = {
  numvar: NumVarGraphNode,
  boolvar: BoolVarGraphNode,
  sum: SumGraphNode,
  if: IfGraphNode
};

export function deserialize(nodes: GraphNodeData<any>[]): GraphNode<any>[] {
  // Create nodes (without connections)
  const newNodes = new Map<number, GraphNode<any>>(
    nodes.map(n => [n.id, new nodeConstructors[n.type](n.id, n.position)])
  );
  // Deserialize port connections
  nodes.forEach(d => {
    Object.keys(d.inputs).forEach(group => {
      const inputs = d.inputs[group];
      inputs.filter(i => typeof(i.connectedTo) === 'object').forEach(i => {
        const inputPort = newNodes.get(d.id).inputPorts.get(group).find(x => x.id === i.id);
        const outputPort = newNodes.get(i.connectedTo.node)[1].outputPorts.get(i.connectedTo.group)[i.connectedTo.output];
        inputPort.connectPortTo(outputPort);
      });
    });
  });
  return [...newNodes.values()];
}

export function createNew(type: GraphNodeType, pos?: Pos) {
  /* TODO: remove node id from deserialized nodes and generate them only during serialization */
  return new nodeConstructors[type](pos);
}
