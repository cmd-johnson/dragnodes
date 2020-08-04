import { combineLatest, BehaviorSubject } from 'rxjs';
import { map, startWith, distinctUntilChanged } from 'rxjs/operators';

import { GraphNode, GraphNodeType, Pos, Input, Output } from '../graph-node';

export class BoolVarGraphNode extends GraphNode<{ value?: boolean }> {
  public readonly nodeType: GraphNodeType = 'boolvar';
  public readonly title = 'Boolean';

  private $value = new BehaviorSubject<boolean>(null);
  public get value(): boolean {
    return this.$value.value;
  }
  public set value(value: boolean) {
    this.$value.next(value);
  }

  public input: Input<boolean>;
  public output: Output<boolean>;

  constructor(position?: Pos) {
    super(position);

    const [input] = this.setInputs({ type: 'bool', title: 'Set' });
    this.input = input;
    const [output] = this.setOutputs({ type: 'bool', title: 'Get' });
    this.output = output;

    combineLatest([
      input.$value.pipe(startWith([null])).pipe(distinctUntilChanged()),
      this.$value.pipe(distinctUntilChanged())
    ]).pipe(
      map(([i, v]) => {
        if (i !== null || v === null) {
          this.value = i;
          return i;
        } else {
          return this.value;
        }
      }),
    ).subscribe(output.$value);
  }

  deserializeNodeData(data: unknown) {
    this.value = typeof((data as any || {}).value) === 'boolean' ? (data as any).value : null;
  }

  serializeNodeData(): { value?: boolean } {
    return { value: this.value };
  }
}
