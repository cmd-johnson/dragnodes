import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { GraphNode, GraphNodeType, Pos, Input, Output } from '../graph-node';

export class DivGraphNode extends GraphNode {
  public readonly nodeType: GraphNodeType = 'div';
  public readonly title = 'A / B';

  inputA: Input<number>;
  inputB: Input<number>;
  output: Output<number>;
  remainder: Output<number>;

  constructor(position?: Pos) {
    super(position);

    const [inA, inB] = this.setInputs(
      { type: 'num', title: 'A' },
      { type: 'num', title: 'B' }
    );
    this.inputA = inA;
    this.inputB = inB;

    const [out, rem] = this.setOutputs(
      { type: 'num', title: 'Result' },
      { type: 'num', title: 'Remainder' }
    );
    this.output = out;

    combineLatest([inA.$value, inB.$value]).pipe(
      map(([a, b]) => a !== null || b !== null ? (a || 0) / (b || 0) : null),
      map(x => x < 0 ? Math.ceil(x) : Math.floor(x))
    ).subscribe(out.$value);

    combineLatest([inA.$value, inB.$value]).pipe(
      map(([a, b]) => a !== null || b !== null ? (a || 0) % (b || 0) : null)
    ).subscribe(rem.$value);
  }
}
