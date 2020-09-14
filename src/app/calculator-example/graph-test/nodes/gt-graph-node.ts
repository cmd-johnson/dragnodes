import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { GraphNode, GraphNodeType, Pos, Input, Output } from '../graph-node';

export class GtGraphNode extends GraphNode {
  public readonly nodeType: GraphNodeType = 'gt';
  public readonly title = 'A > B';

  inputA: Input<number>;
  inputB: Input<number>;
  output: Output<boolean>;

  constructor(position?: Pos) {
    super(position);

    const [inA, inB] = this.setInputs(
      { type: 'num', title: 'A' },
      { type: 'num', title: 'B' }
    );
    this.inputA = inA;
    this.inputB = inB;

    const [out] = this.setOutputs({ type: 'bool', title: 'Result' });
    this.output = out;

    combineLatest([inA.$value, inB.$value]).pipe(
      map(([a, b]) => a !== null || b !== null ? (a || 0) > (b || 0) : null)
    ).subscribe(out.$value);
  }
}
