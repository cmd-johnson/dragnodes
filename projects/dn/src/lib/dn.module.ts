import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphComponent } from './components/graph/graph.component';
import { NodePortDirective } from './directives/node-port/node-port.directive';
import { ConnectionsComponent } from './components/graph/connections/connections.component';
import { NodeComponent } from './components/graph/node/node.component';

@NgModule({
  declarations: [
    GraphComponent,
    NodePortDirective,
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

import { enableMapSet, enablePatches } from 'immer';
enableMapSet();
enablePatches();
