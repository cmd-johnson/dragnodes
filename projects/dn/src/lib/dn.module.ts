import { NgModule } from '@angular/core';
import { DnComponent } from './dn.component';
import { DragContainerComponent } from './components/drag-container/drag-container.component';
import { DraggableComponent } from './components/draggable/draggable.component';
import { NodeComponent } from './components/node/node.component';
import { DraggableDirective } from './directives/draggable/draggable.directive';
import { NodeAreaComponent } from './components/node-area/node-area.component';
import { CommonModule } from '@angular/common';
import { GraphComponent } from './components/graph/graph.component';
import { NodePortDirective } from './directives/node-port/node-port.directive';

@NgModule({
  declarations: [
    DnComponent,
    DragContainerComponent,
    DraggableComponent,
    NodeComponent,
    DraggableDirective,
    NodeAreaComponent,
    GraphComponent,
    NodePortDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    DnComponent,
    DragContainerComponent,
    DraggableComponent,
    DraggableDirective,
    NodeComponent,
    NodeAreaComponent,
    GraphComponent
  ]
})
export class DnModule { }
