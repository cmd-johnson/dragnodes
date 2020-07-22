import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { CalculatorExpressionService, Expr, Var } from './calculator-expression/calculator-expression.service';

interface InputPort {
  id: number;
  connectedToNode?: number;
}

interface OutputPort {
  id: number;
  connectedTo?: { node: number, port: number };
}

interface Node {
  key: number;
  position: { x: number, y: number };
  node: Expr;
  inputs: InputPort[];
  outputs: OutputPort[];
}

@Component({
  selector: 'app-calculator-example',
  templateUrl: './calculator-example.component.html',
  styleUrls: ['./calculator-example.component.scss']
})
export class CalculatorExampleComponent implements OnDestroy {
  private unsubscribe = new Subject();

  private nodeMetadata = new Map<Expr, Node>();
  private nodeKeyMap = new Map<number, Node>();
  private nextNodeKey = 0;

  get nodeList(): readonly Node[] {
    return this.calculator.nodes.map(n => this.getNodeMetadata(n));
  }

  constructor(
    private readonly calculator: CalculatorExpressionService
  ) { }

  private getNodeMetadata(node: Expr): Node {
    if (!this.nodeMetadata.has(node)) {
      const nextKey = this.nextNodeKey++;
      const metadata = {
        key: nextKey,
        position: { x: 0, y: 0 },
        outputs: node.output,
        inputs: node.type === 'value' ? [] : node.type === 'result' ? [{ id: 0 }] : [{ id: 0 }, { id: 1 }],
        node
      };
      this.nodeMetadata.set(node, metadata);
      this.nodeKeyMap.set(nextKey, metadata);
      return metadata;
    }
    return this.nodeMetadata.get(node);
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  trackNode(_, node: Node) {
    return node.key;
  }

  addVariable() {
    this.calculator.addVariable(0);
  }

  addBoolean() {
  }

  addSumExpression() {
    this.calculator.addExpression<number, number>(2, i => i.filter(x => x !== null && typeof(x) === 'number').reduce((a, b) => a + b, 0));
  }

  addSubtractExpression() {
    this.calculator.addExpression<number, number>(2, ([a, b]) => typeof(a) === 'number' && typeof(b) === 'number' ? a - b : NaN);
  }

  removeNode(node: Node) {
    this.calculator.removeNode(node.node);
  }

  getInputDragOriginPort(): (port: InputPort) => InputPort | OutputPort | false {
    return port => {
      if (port.connectedToNode !== undefined) {
        return this.nodeKeyMap.get(port.connectedToNode).outputs[0];
      }
      return port;
    };
  }

  getOutputDragOriginPort(): (port: OutputPort) => OutputPort | InputPort | false {
    return port => {
      if (port.connectedTo !== undefined) {
        return this.nodeKeyMap.get(port.connectedTo.node).inputs[port.connectedTo.port];
      }
      return port;
    };
  }

  canConnect(output: OutputPort, input: InputPort) {
    return output.connectedTo === undefined && input.connectedToNode === undefined;
  }

  disconnectOutput(node: Node, port: OutputPort) {
    if (port.connectedTo === undefined) {
      return;
    }
    const inputNode = this.nodeKeyMap.get(port.connectedTo.node);
    this.calculator.disconnectNode(node.node as any, inputNode.node as any);
    inputNode.inputs[port.connectedTo.port].connectedToNode = undefined;
    port.connectedTo = undefined;
  }

  disconnectInput(node: Node, port: InputPort) {
    if (port.connectedToNode === undefined) {
      return;
    }
    const outputNode = this.nodeKeyMap.get(port.connectedToNode);
    this.calculator.disconnectNode(outputNode.node as any, node.node as any);
    outputNode.outputs[0].connectedTo = undefined;
    port.connectedToNode = undefined;
  }

  connect(...args) {
    console.log(...args);
  }
}
