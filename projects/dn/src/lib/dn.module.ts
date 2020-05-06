import { NgModule } from '@angular/core';
import { DnComponent } from './dn.component';
import { CommonModule } from '@angular/common';
import { GraphComponent } from './components/graph/graph.component';
import { NodePortDirective } from './directives/node-port/node-port.directive';
import { NodeDirective } from './directives/node/node.directive';
import { ConnectionsComponent } from './components/graph/connections/connections.component';
import { NodeComponent } from './components/graph/node/node.component';
import { PortComponent } from './components/graph/node/port/port.component';

@NgModule({
  declarations: [
    DnComponent,
    GraphComponent,
    NodePortDirective,
    NodeDirective,
    ConnectionsComponent,
    NodeComponent,
    PortComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    DnComponent,
    GraphComponent
  ]
})
export class DnModule { }
