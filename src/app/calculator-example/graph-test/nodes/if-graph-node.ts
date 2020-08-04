import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { Input, Output, GraphNode, GraphNodeType, Pos } from '../graph-node';

export class IfGraphNode extends GraphNode {
  public readonly nodeType: GraphNodeType = 'if';
  public readonly title = 'If Then Else';

  public condition: Input<boolean>;
  public ifTrue: Input<number>;
  public ifFalse: Input<number>;
  public output: Output<number>;

  constructor(position?: Pos) {
    super(position);

    const { '': [cond], 'Branches': [t, f] } = Object.fromEntries(this.setInputGroups({
      '': [{ type: 'bool', title: 'Condition' }],
      Branches: [
        { type: 'num', title: 'True' },
        { type: 'num', title: 'False' }
      ]
    }));
    this.condition = cond as Input<boolean>;
    this.ifTrue = t as Input<number>;
    this.ifFalse = f as Input<number>;

    const [out] = this.setOutputs({ type: 'num', title: 'Result' });
    this.output = out;

    cond.$value.pipe(
      switchMap(c => c === true ? t.$value : c === false ? f.$value : of(null))
    ).subscribe(out.$value);
  }
}
