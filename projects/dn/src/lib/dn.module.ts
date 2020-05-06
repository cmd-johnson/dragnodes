import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphComponent } from './components/graph/graph.component';
import { NodePortDirective } from './directives/node-port/node-port.directive';
import { NodeDirective } from './directives/node/node.directive';
import { ConnectionsComponent } from './components/graph/connections/connections.component';
import { NodeComponent } from './components/graph/node/node.component';

@NgModule({
  declarations: [
    GraphComponent,
    NodePortDirective,
    NodeDirective,
    ConnectionsComponent,
    NodeComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    GraphComponent
  ]
})
export class DnModule { }

import { enableMapSet } from 'immer';
enableMapSet();
