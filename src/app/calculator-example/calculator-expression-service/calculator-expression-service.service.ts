import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, OperatorFunction } from 'rxjs';
import { switchMap, map, shareReplay, distinctUntilChanged } from 'rxjs/operators';

class Expr<I, O> {
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
    calculateOutput: (inputs: I[]) => O,
    op: OperatorFunction<O, O> = o => o
  ) {
    this.id = Expr.nextId++;

    this.inputs = new BehaviorSubject([...Array(inputCount)].map(() => null));
    this.output = this.inputs.pipe(
      switchMap(i => combineLatest(i.map(e => e.output))),
      map(i => calculateOutput(i)),
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

class Var<V> extends Expr<V, V> {
  private val: BehaviorSubject<V>;

  get value(): V {
    return this.val.value;
  }

  set value(value: V) {
    this.val.next(value);
  }

  constructor(initial: V) {
    const value = new BehaviorSubject<V>(initial);
    super(1, ([v]) => v, (input: Observable<V>) => combineLatest([input, value]).pipe(
      distinctUntilChanged(([v1, i1], [v2, i2]) => v1 !== v2 || i1 !== i2),
      map(([i, v]) => {
        if (i !== null) {
          value.next(i);
          return i;
        }
        return v;
      })
    ));
    this.val = value;
  }
}

@Injectable({
  providedIn: 'root'
})
export class CalculatorExpressionServiceService {

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

  addExpression<I, O>(inputCount: number, calculateValue: (inputs: I[]) => O): void {
    this.addNode(new Expr<I, O>(inputCount, calculateValue));
  }

  addVariable<T>(initial: T): void {
    const node = new Var<T>(initial);
    this.addNode(node);
    this.variables.set(node.id, node);
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
