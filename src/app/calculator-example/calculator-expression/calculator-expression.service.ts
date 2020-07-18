import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, OperatorFunction, of } from 'rxjs';
import { switchMap, map, shareReplay } from 'rxjs/operators';

export class Expr<I = any, O = any> {
  private static nextId = 0;
  public readonly id: number;

  private inputs: BehaviorSubject<Expr<any, I>[]>;
  public readonly output: Observable<O>;

  private outputNode: Expr<O, any> = null;

  public get inputNodes(): readonly Expr<any, I>[] {
    return [...this.inputs.value];
  }

  constructor(
    public readonly inputCount: number,
    op: OperatorFunction<I[], O>
  ) {
    this.id = Expr.nextId++;

    this.inputs = new BehaviorSubject([...Array(inputCount)].map(() => null));
    this.output = this.inputs.pipe(
      switchMap(i => combineLatest(i.map(e => e && e.output || of(null)))),
      op,
      shareReplay(1)
    );
  }

  public setInput(index: number, input: Expr<any, I>) {
    if (index >= 0 && index < this.inputNodes.length) {
      if (input !== null) {
        input.clearOutput();
        input.outputNode = this;
      }
      const newInputs = [...this.inputNodes];
      newInputs[index] = input;
      this.inputs.next(newInputs);
    }
  }

  public clearInput(input: number | Expr<any, I>) {
    const index = typeof(input) === 'number' ? input : this.inputNodes.indexOf(input);
    this.setInput(index, null);
  }

  public clearInputs() {
    this.inputNodes.filter(i => i !== null).forEach(i => i.clearOutput);
    this.inputs.next([...Array(this.inputCount)].map(() => null));
  }

  public clearOutput() {
    if (this.outputNode !== null) {
      this.outputNode.clearInput(this);
    }
  }
}

export class Var<V> extends Expr<V, V> {
  private val: BehaviorSubject<V>;

  get value(): V {
    return this.val.value;
  }

  set value(value: V) {
    // Diretly setting values only works when the variable has no input, because
    // the value would be overwritten by the input
    if (this.inputNodes.every(i => i === null)) {
      this.val.next(value);
    }
  }

  constructor(initial: V) {
    const value = new BehaviorSubject<V>(initial);
    super(1, input => combineLatest([input.pipe(map(([v]) => v)), value]).pipe(
      map(([i, v]) => {
        console.log('mapping', i, v);
        if (i !== null && i !== v) {
          value.next(i);
          return i;
        }
        return v;
      })
    ));
    this.val = value;
    this.output.subscribe();
  }
}

@Injectable({
  providedIn: 'root'
})
export class CalculatorExpressionService {

  private expressionNodes: Expr<any, any>[] = [];
  private variables = new Map<number, Var<any>>();

  public get nodes(): Expr<any, any>[] {
    return [...this.expressionNodes.values()];
  }

  constructor() { }

  private addNode(expression: Expr<any, any>): void {
    if (this.expressionNodes.every(n => n.id !== expression.id)) {
      this.expressionNodes.push(expression);
    }
  }

  addExpression<I, O>(inputCount: number, calculateValue: (inputs: I[]) => O): Expr<I, O> {
    const expr = new Expr<I, O>(inputCount, map(calculateValue));
    this.addNode(expr);
    return expr;
  }

  addVariable<T>(initial: T): Var<T> {
    const node = new Var<T>(initial);
    this.addNode(node);
    this.variables.set(node.id, node);
    return node;
  }

  removeNode(node: Expr<any, any>): void {
    const nodeId = this.expressionNodes.findIndex(n => n.id === node.id);
    if (nodeId >= 0) {
      node.clearInputs();
      node.clearOutput();
      this.expressionNodes.splice(nodeId, 1);
      if (node instanceof Var) {
        this.variables.delete(node.id);
      }
    }
  }

  getVariable(id: number): Var<any> {
    return this.variables.get(id);
  }
}
