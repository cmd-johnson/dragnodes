import { NgModule } from '@angular/core';
import { DnComponent } from './dn.component';
import { GraphComponent } from './components/graph/graph.component';
import { ConnectionComponent } from './components/connection/connection.component';
import { NodeDirective } from './directives/node/node.directive';
import { NodePortDirective } from './directives/node-port/node-port.directive';
import { CommonModule } from '@angular/common';



@NgModule({
  declarations: [
    DnComponent,
    GraphComponent,
    ConnectionComponent,
    NodeDirective,
    NodePortDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    DnComponent,
    GraphComponent,
    ConnectionComponent,
    NodeDirective,
    NodePortDirective
  ]
})
export class DnModule { }
