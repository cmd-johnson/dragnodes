import { Component, OnInit } from '@angular/core';

interface Input {
  title: string;
}

interface Output {
  title: string;
}

interface Node {
  title: string;
  x: number;
  y: number;
  inputs: Input[];
  outputs: Output[];
}

type InputKey = string;
type OutputKey = string;

/*interface InputKey {
  node: { title: string };
  input: Input;
}

interface OutputKey {
  node: { title: string };
  output: Output;
}*/

type PortKey = OutputKey | InputKey;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'dragnodes';

  nodes: Node[] = [];

  ngOnInit(): void {
    const stored = window.localStorage.getItem('nodes');
    if (stored) {
      this.nodes = JSON.parse(stored);
    } else {
      this.nodes = [
        {
          title: 'Node 1',
          x: 0, y: 0,
          inputs: [ { title: 'Input 1' }, { title: 'Input 2' } ],
          outputs: [ { title: 'Output 1' }, { title: 'Output 2' } ]
        },
        {
          title: 'Node 2',
          x: 250, y: 0,
          inputs: [ { title: 'Input 1' }, { title: 'Input 2' } ],
          outputs: [ { title: 'Output 1' }, { title: 'Output 2' } ]
        }
      ];
    }
  }

  nodeId(node): string {
    return node.title;
  }

  trackPortId(port: Input | Output) {
    return port.title;
  }

  inputPortKey(node: Node, input: Input): InputKey {
    return `I_${node.title}_${input.title}`;
    // return { node: { title: node.title }, input };
  }

  outputPortKey(node: Node, output: Output): OutputKey {
    return `O_${node.title}_${output.title}`;
    //return { node: { title: node.title }, output };
  }

  onNodeMoved(node: Node, position: { x: number, y: number }) {
    node.x = position.x;
    node.y = position.y;
    this.saveNodes();
  }

  addInput(node: Node) {
    if (node.inputs.length === 0) {
      node.inputs.push({ title: 'Input 1' });
    } else {
      const lastNode = node.inputs[node.inputs.length - 1].title.split(' ');
      const nextId = parseInt(lastNode[lastNode.length - 1], 10) + 1;
      node.inputs.push({ title: `Input ${nextId}`});
    }
    this.saveNodes();
  }

  removeInput(node: Node, input: Input) {
    const index = node.inputs.findIndex(o => o.title === input.title);
    if (index >= 0) {
      node.inputs.splice(index, 1);
    }
    this.saveNodes();
  }

  addOutput(node: Node) {
    if (node.outputs.length === 0) {
      node.outputs.push({ title: 'Output 1' });
    } else {
      const lastNode = node.outputs[node.outputs.length - 1].title.split(' ');
      const nextId = parseInt(lastNode[lastNode.length - 1], 10) + 1;
      node.outputs.push({ title: `Output ${nextId}`});
    }
    this.saveNodes();
  }

  removeOutput(node: Node, output: Output) {
    const index = node.outputs.findIndex(o => o.title === output.title);
    if (index >= 0) {
      node.outputs.splice(index, 1);
    }
    this.saveNodes();
  }

  private saveNodes() {
    const serialized = JSON.stringify(this.nodes);
    window.localStorage.setItem('nodes', serialized);
  }

  canConnectPorts(output: PortKey, input: PortKey) {
    const nodeA = output.split('_')[1];
    const nodeB = input.split('_')[1];

    return nodeA !== nodeB;

    /*if (output.node.title === input.node.title) {
      return false;
    }
    return true;*/
  }

  addNode() {
    this.nodes.push({
      title: `Node ${this.nodes.length}`,
      inputs: [],
      outputs: [],
      x: 0,
      y: 0
    });
  }
}
