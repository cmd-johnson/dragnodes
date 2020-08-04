import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith, distinctUntilChanged } from 'rxjs/operators';

import { GraphNode, GraphNodeType, Pos, Output, Input } from '../graph-node';

export class NumVarGraphNode extends GraphNode<{ value?: number }> {
  public readonly nodeType: GraphNodeType = 'numvar';
  public readonly title = 'Number';

  private $value = new BehaviorSubject<number>(null);
  public get value(): number {
    return this.$value.value;
  }
  public set value(value: number) {
    this.$value.next(value);
  }

  public input: Input<number>;
  public output: Output<number>;

  constructor(position?: Pos) {
    super(position);

    const [input] = this.setInputs({ type: 'num', title: 'Set' });
    this.input = input;
    const [output] = this.setOutputs({ type: 'num', title: 'Get' });
    this.output = output;

    combineLatest([
      input.$value.pipe(startWith([null]), distinctUntilChanged()),
      this.$value.pipe(distinctUntilChanged())
    ]).pipe(
      map(([i, v]) => {
        if (i !== null || v === null) {
          this.value = i;
          return i;
        } else {
          return this.value;
        }
      })
    ).subscribe(output.$value);
  }

  deserializeNodeData(data: unknown) {
    this.value = typeof((data as any || {}).value) === 'number' ? (data as any).value : null;
  }

  serializeNodeData(): { value?: number } {
    return { value: this.value };
  }
}
