import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GraphComponent } from './components/graph/graph.component';
import { NodeDirective } from './directives/node/node.directive';
import { ConnectionsComponent } from './components/graph/connections/connections.component';
import { NodePortDirective } from './directives/node-port/node-port';

@NgModule({
  declarations: [
    GraphComponent,
    ConnectionsComponent,
    NodeDirective,
    NodePortDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    GraphComponent,
    NodeDirective,
    NodePortDirective
  ]
})
export class DnModule { }
