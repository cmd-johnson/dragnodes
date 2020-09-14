import { GraphNodeType, Pos, GraphNode, GraphNodeData, Input } from './graph-node';
import { NumVarGraphNode } from './nodes/num-var-graph-node';
import { BoolVarGraphNode } from './nodes/bool-var-graph-node';
import { SumGraphNode } from './nodes/sum-graph-node';
import { IfGraphNode } from './nodes/if-graph-node';
import { SubGraphNode } from './nodes/sub-graph-node';
import { MultGraphNode } from './nodes/mult-graph-node';
import { DivGraphNode } from './nodes/div-graph-node';
import { GtGraphNode } from './nodes/gt-graph-node';
import { GteGraphNode } from './nodes/gte-graph-node';
import { EqGraphNode } from './nodes/eq-graph-node';
import { LteGraphNode } from './nodes/lte-graph-node';
import { LtGraphNode } from './nodes/lt-graph-node';

const nodeConstructors: { readonly [T in GraphNodeType]: new (pos?: Pos) => GraphNode<any> } = {
  numvar: NumVarGraphNode,
  boolvar: BoolVarGraphNode,
  sum: SumGraphNode,
  sub: SubGraphNode,
  mult: MultGraphNode,
  div: DivGraphNode,
  gt: GtGraphNode,
  gte: GteGraphNode,
  eq: EqGraphNode,
  lte: LteGraphNode,
  lt: LtGraphNode,
  if: IfGraphNode
};

function deserializePosition(serialized: any): Pos | undefined {
  if (typeof(serialized) !== 'object') { return undefined; }
  return {
    x: typeof(serialized.x) === 'number' ? serialized.x : 0,
    y: typeof(serialized.y) === 'number' ? serialized.y : 0
  };
}

function tuple<Args extends any[]>(...args: Args): Args { return args; }

export function deserialize(nodes: unknown): GraphNode<any>[] {
  // Input for deserialization is not to be trusted - perform typechecks *everywhere*
  if (!Array.isArray(nodes)) {
    return [];
  }

  const deserialized = new Map<number, [any, GraphNode<any>]>(nodes
    .map((n, i) => tuple(i, n))
    .filter(([_, n]) => typeof(n) === 'object' && Object.keys(nodeConstructors).some(t => n.type === t))
    .map(([i, n]) => [i, [n, createNew(n.type, deserializePosition(n.position))]])
  );

  for (const [data, node] of deserialized.values()) {
    if (!!data.inputs && typeof(data.inputs) === 'object' && !Array.isArray(data.inputs)) {
      for (const [groupName, group] of node.inputs.entries()) {
        if (!(groupName in data.inputs)) { continue; }
        if (!Array.isArray(data.inputs[groupName])) { continue; }
        const serializedGroup: any[] = data.inputs[groupName];

        for (let i = 0; i < serializedGroup.length && i < group.length; i++) {
          const sInput = serializedGroup[i];
          if (!sInput || typeof(sInput) !== 'object') { continue; }
          if (!sInput.connectedTo || typeof(sInput.connectedTo) !== 'object') { continue; }
          const ct = sInput.connectedTo;

          if (!deserialized.has(ct.node)) { continue; }
          const otherNode = deserialized.get(ct.node)[1];

          if (!otherNode.outputs.has(ct.group)) { continue; }
          const otherGroup = otherNode.outputs.get(ct.group);

          if (typeof(ct.output) !== 'number' || ct.output < 0 || ct.output > otherGroup.length) { continue; }
          const output = otherGroup[ct.output];

          if (!output.canConnectPortTo(group[i])) { continue; }
          output.connectPortTo(group[i]);
        }
      }
    }

    node.deserializeNodeData(data.data);
    if (data.data !== undefined && data.data !== null) {
    }
  }

  return [...deserialized.values()].map(([_, n]) => n);

  /*

  const serializedNodes: ({ type: GraphNodeType, [key: string]: unknown } | null)[] = nodes
    .map(n => typeof(n) === 'object' && Object.keys(nodeConstructors).some(t => n.type === t) ? n : null);

  const newNodes = serializedNodes.map(n => n !== null ? tuple(n, createNew(n.type, deserializePosition(n.position))) : null);
  newNodes.filter(n => n !== null && !!n[0].data).forEach(([data, node]) => node.deserializeNodeData(data.data));

  for (const [data, deserializedNode] of newNodes) {
    if (typeof(data.inputs) !== 'object' || Array.isArray(data.inputs)) {
      continue;
    }
    const inputs: object = data.inputs;
    const serializedGroups = [...deserializedNode.inputs.keys()].filter(k => k in inputs);
    for (const group of serializedGroups) {
      for (const g of data.inputs[group])
    }

    ([...deserializedNode.inputs.keys()]).filter(k => k in inputs)
      .map(key => tuple(data.inputs[key], deserializedNode.inputs.get(key)))
      .forEach(([d, input]) => {
        if (!Array.isArray(d)) { return; }
        for (let i = 0; i < d.length && i < input.length; i++) {
          if (typeof(d[i]) !== 'object') { continue; }
          const { connectedTo } = d[i];
          if (typeof(connectedTo) !== 'object') { continue; }
          const { node: nodeId, group, output } = connectedTo;
          if (typeof(nodeId) !== 'number' || typeof(group) !== 'string' || typeof(output) !== 'number') { continue; }
          if (nodeId < 0 || nodeId >= newNodes.length || output < 0) { continue; }
          const node = newNodes[nodeId][1];
          if (!node.outputs.has(group)) { continue; }
          const og = node.outputs.get(group);
          if (output < 0 || output >= og.length) { continue; }
          if (!input[i].canConnectPortTo(og[output])) { continue; }
          input[i].connectPortTo(og[output]);
        }
      });
  }

  return newNodes.map(([_, n]) => n);

  /*
  // Create nodes (without connections)
  const newNodes: [GraphNodeData, GraphNode][] = nodes.map(n => [n, createNew(n.type, n.position)]);

  // Deserialize node data
  newNodes.forEach(([s, n]) => n.deserializeNodeData(s.data));

  // Deserialize port connections
  newNodes.forEach(([nodeData, node]) => {
    for (const inputGroup in node.inputs) {
      if (!(inputGroup in nodeData.inputs)) {
        continue;
      }
      const inputs = nodeData.inputs[inputGroup];
      for (const c in inputs)
      inputs
        .filter(i => typeof(i) === 'object')
        .filter(i => typeof(i.connectedTo) === 'object')
        .map(i => i.connectedTo)
        .filter(c => typeof(c.node) === 'string')
        .filter(c => typeof(c.group) === 'string')
        .filter(c => typeof(c.output) === 'number' && c.output >= 0)
        .forEach(c => {
          const connectedNode = newNodes[c.node][1];
          if (connectedNode === undefined || !connectedNode.outputs.has(c.group)) {
            return;
          }
          const outputGroup = connectedNode.outputs.get(c.group);
          if (c.output >= outputGroup.length) {
            return;
          }
          const output = outputGroup[c.output];
          output.connectPortTo()
        });
    }
  });
  
  newNodes.forEach(([nodeData, node]) => {
    [...node.inputs.keys()]
      .filter(([key]) => key in nodeData.inputs)
      .map(([_, inputs]) => {

      })
    node.inputs.forEach((inputs, group) => {
      if (!(group in nodeData.inputs)) {
        return;
      }
    });
    Object.keys(nodeData.inputs || {})
      .filter(key => node.inputs.has(key)) // Ignore non-existant inputs
      .map(group => node.inputs.get(group)
        .map((p, i) => [p, nodeData.inputs[group][i]] as [Input, GraphNodeData['inputs'][''][0]])
        .filter(([_, s]) => typeof(s.connectedTo) === 'object')
        .forEach(([input, serialized]) => {
          const { node: n, group: g, output } = serialized.connectedTo;
          input.connectPortTo(newNodes[n][1].outputs.get(g)[output]);
        })
      );
  });

  return newNodes.map(([_, n]) => n); */
}

function serializeInput(graphNodes: GraphNode<any>[], input: Readonly<Input>): GraphNodeData['inputs'][''][0] {
  if (!input.connectedTo) {
    return null;
  }
  const nodeId = graphNodes.findIndex(gn => gn === input.connectedTo.node);
  const group = input.connectedTo.node.outputs.get(input.connectedTo.group);
  const outputId = group.findIndex(o => o === input.connectedTo);
  return { connectedTo: {
    node: nodeId, group: input.connectedTo.group, output: outputId
  } };
}

export function serialize(graphNodes: GraphNode<any>[]): GraphNodeData<any>[] {
  return graphNodes.map(n => {
    const serialized: GraphNodeData<any> = {
      type: n.nodeType,
      position: n.position,
      inputs: [...n.inputs.entries()].reduce((groups, [group, ins]) => ({
        ...groups,
        [group]: ins.map(i => serializeInput(graphNodes, i)) }
      ), {})
    };
    const data = n.serializeNodeData();
    if (data !== null && data !== undefined) {
      serialized.data = data;
    }

    return serialized;
  });
}

export function createNew(type: GraphNodeType, pos?: Pos) {
  return new nodeConstructors[type](pos);
}
