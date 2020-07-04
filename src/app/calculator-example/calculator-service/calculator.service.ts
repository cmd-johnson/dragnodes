import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, Observable, of, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

interface ExpressionNode {
  type: 'expression';
  kind: string;
  inputs: BehaviorSubject<Set<OutputCalculatorNode>>;
  output: Observable<number | null>;
}

interface ValueNode {
  type: 'value';
  value: BehaviorSubject<number | null>;
}

interface ResultNode {
  type: 'result';
  input: BehaviorSubject<OutputCalculatorNode | null>;
  result: Subject<number | null>;
}

type OutputCalculatorNode = ValueNode | ExpressionNode;
type InputCalculatorNode = ExpressionNode | ResultNode;
export type CalculatorNode = OutputCalculatorNode | InputCalculatorNode;

@Injectable({
  providedIn: 'root'
})
export class CalculatorService {
  private nodes: CalculatorNode[] = [];

  public get nodeList(): Readonly<CalculatorNode[]> {
    return this.nodes;
  }

  constructor() { }

  public addNumberValue() {
    this.nodes.push({
      type: 'value',
      value: new BehaviorSubject<number | null>(null)
    });
  }

  public addSum() {
    const inputs = new BehaviorSubject<Set<OutputCalculatorNode>>(new Set());
    const output = inputs.pipe(
      switchMap(i => {
        if (i.size === 0) {
          return of(null);
        }
        return combineLatest([...i].map(n => n.type === 'expression' ? n.output : n.value)).pipe(
          map(v => v.reduce((a, b) => a + b))
        );
      })
    );
    this.nodes.push({ type: 'expression', kind: 'sum', inputs, output });
  }

  public addSubtraction() {
    const inputs = new BehaviorSubject<Set<OutputCalculatorNode>>(new Set());
    const output = inputs.pipe(
      switchMap(i => {
        if (i.size < 2) {
          return of(null);
        }
        return combineLatest([...i].map(n => n.type === 'expression' ? n.output : n.value)).pipe(
          map(v => v.reduce((a, b) => a - b))
        );
      })
    );
    this.nodes.push({ type: 'expression', kind: 'subtraction', inputs, output });
  }

  public addResult() {
    const input = new BehaviorSubject<OutputCalculatorNode | null>(null);
    const result = new Subject<number | null>();
    input.pipe(switchMap(
      i => i === null ? of(null) : (i.type === 'value' ? i.value : i.output)
    )).subscribe(result);
    this.nodes.push({ type: 'result', input, result });
  }

  public disconnectNode(output: OutputCalculatorNode, input: InputCalculatorNode) {
    if (input.type === 'expression') {
      input.inputs.next(new Set([...input.inputs.value].filter(o => o !== output)));
    } else {
      input.input.next(null);
    }
  }

  public removeNode(node: CalculatorNode) {
    if (node.type !== 'result') {
      // Remove the node's output from the inputs of all other nodes
      this.nodes.filter(n => n !== node).forEach(n => {
        if (n.type === 'expression') {
          if (n.inputs.value.has(node)) {
            n.inputs.next(new Set([...n.inputs.value].filter(i => i !== node)));
          }
        } else if (n.type === 'result' && n.input.value === node) {
          n.input.next(null);
        }
      });
    }
    this.nodes = this.nodes.filter(n => n !== node);
  }
}
