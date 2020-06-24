import { Component } from '@angular/core';

interface Input {
  name: string;
}

interface Output {
  name: string;
}

interface Node {
  position: Pos;
  name: string;
  inputs: Input[];
  outputs: Output[];
}

interface Connection {
  data: number;
  from: string;
  to: string;
}

interface Pos {
  x: number;
  y: number;
}

@Component({
  selector: 'app-test-graph',
  templateUrl: './test-graph.component.html',
  styleUrls: ['./test-graph.component.scss']
})
export class TestGraphComponent {
  nodes: Node[] = [];
  connections: Connection[] = [];

  constructor() {
    const nodeCount = 20;
    const inputsPerNode = 10;
    const outputsPerNode = 10;

    let outputs: string[] = [];
    let inputs: string[] = [];
    for (let n = 0; n < nodeCount; n++) {
      const node = {
        name: `Node ${n + 1}`,
        position: { x: 0, y: 0 },
        outputs: [...new Array(outputsPerNode)].map((_, i) => ({ name: `Output ${i + 1}` })),
        inputs: [...new Array(inputsPerNode)].map((_, i) => ({ name: `Input ${i + 1}` }))
      };
      this.nodes.push(node);
      outputs = [...outputs, ...node.outputs.map(o => this.portKey(node, o))];
      inputs = [...inputs, ...node.inputs.map(i => this.portKey(node, i))];
    }
    while (outputs.length > 0 && inputs.length > 0) {
      const outputId = Math.floor(Math.random() * outputs.length);
      const inputId = Math.floor(Math.random() * inputs.length);
      const output = outputs.splice(outputId, 1)[0];
      const input = inputs.splice(inputId, 1)[0];
      this.connections.push({ from: output, to: input, data: 0.5 });
    }
  }

  onConnected({ from, to }: { from: string, to: string }) {
    this.connections.push({ from, to, data: 0.5 });
  }

  connectionPath({ x: fx, y: fy }: Pos, { x: tx, y: ty }: Pos): string {
    const dx = tx - fx;
    const dy = ty - fy;

    const minDx = 30;

    if (dx >= 2 * minDx) {
      return `M${fx},${fy} l${dx / 2},0 l0,${dy} l${dx / 2},0`;
    } else {
      const horizontalLength = dx - minDx * 2;
      return `M${fx},${fy} l${minDx},0 l0,${Math.ceil(dy / 2)} l${horizontalLength},0 l0,${Math.floor(dy / 2)} l${minDx},0`;
    }
  }

  trackNode(_, node: Node) {
    return node.name;
  }

  portKey(node: Node, port: Input | Output) {
    return `${node.name}_${port.name}`;
  }

  trackPortId(_, port: Input | Output) {
    return port.name;
  }

  debugLog(...args) {
    console.log(...args);
  }

  getDragOriginPort = (port: { output: string } | { input: string }) => {
    if ('output' in port) {
      const existingConnection = this.connections.find(c => c.from === port.output);
      if (existingConnection) {
        return { input: existingConnection.to };
      }
    } else {
      const existingConnection = this.connections.find(c => c.to === port.input);
      if (existingConnection) {
        return { output: existingConnection.from };
      }
    }
    return port;
  }

  canConnect = (output: string, input: string) => {
    return !this.connections.some(c => c.from === output || c.to === input);
  }

  connect({ output, input }: { output: string, input: string }) {
    console.log('connecting', output, 'to', input);
    this.connections.push({ from: output, to: input, data: 0.5 });
  }

  disconnectOutput(output: string) {
    console.log('disc o', output);
    const index = this.connections.findIndex(c => c.from === output);
    if (index >= 0) {
      this.connections.splice(index, 1);
    }
  }

  disconnectInput(input: string) {
    console.log('disc i', input);
    const index = this.connections.findIndex(c => c.to === input);
    if (index >= 0) {
      this.connections.splice(index, 1);
    }
  }

  addInput({ inputs }: Node) {
    if (inputs.length === 0) {
      inputs.push({ name: 'Input 1' });
    } else {
      const last = inputs[inputs.length - 1];
      const x = last.name.split(' ');
      const num = parseInt(x[x.length - 1], 10);
      inputs.push({ name: `Input ${num + 1}`});
    }
  }

  addOutput({ outputs }: Node) {
    if (outputs.length === 0) {
      outputs.push({ name: 'Output 1' });
    } else {
      const last = outputs[outputs.length - 1];
      const x = last.name.split(' ');
      const num = parseInt(x[x.length - 1], 10);
      outputs.push({ name: `Output ${num + 1}` });
    }
  }

  removeInput(node: Node, input: Input) {
    node.inputs.splice(node.inputs.indexOf(input), 1);
    this.disconnectInput(this.portKey(node, input));
  }

  removeOutput(node: Node, output: Output) {
    node.outputs.splice(node.outputs.indexOf(output), 1);
    this.disconnectOutput(this.portKey(node, output));
  }

}
