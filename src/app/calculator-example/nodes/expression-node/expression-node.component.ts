import { Component, Input } from '@angular/core';
import { NodeDirective } from 'projects/dn/src/lib/directives/node/node.directive';

@Component({
  selector: 'app-expression-node',
  templateUrl: './expression-node.component.html',
  styleUrls: ['./expression-node.component.scss']
})
export class ExpressionNodeComponent extends NodeDirective {

  @Input()
  expression: any;

}
