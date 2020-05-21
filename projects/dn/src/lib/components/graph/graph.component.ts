import { Component, OnDestroy, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { GraphService, GraphState } from '../../services/graph/graph.service';
import { ResolvePortService } from '../../services/resolve-port/resolve-port.service';
import { GraphNode, InputPort, OutputPort } from '../../data/graph-types';
import { Position } from '../../data/position';

@Component({
  selector: 'dn-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss'],
  providers: [ GraphService, ResolvePortService ]
})
export class GraphComponent implements OnDestroy {
  private unsubscribe = new Subject();

  graphState: GraphState;
  visibleConnections = new EventEmitter<{ from: Position | OutputPort, to: Position | InputPort }[]>();

  private nodeCounter = 0;

  constructor(
    private graphService: GraphService
  ) {
    graphService.visibleConnections.pipe(
      takeUntil(this.unsubscribe)
    ).subscribe(this.visibleConnections);

    graphService.state.pipe(
      takeUntil(this.unsubscribe)
    ).subscribe(s => this.graphState = s);
  }

  getNodeTransform(node: GraphNode) {
    return `translate(${node.position.x}px, ${node.position.y}px)`;
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  addNode() {
    const node = new GraphNode(`Node #${this.nodeCounter}`);
    const outputCount = Math.floor(Math.random() * 3);
    const inputCount = Math.floor(Math.random() * 5);

    for (let i = 0; i < outputCount; i++) {
      node.addOutput(new OutputPort(`output ${i}`, new Subject()));
    }
    for (let i = 0; i < inputCount; i++) {
      node.addInput(new InputPort(`input ${i}`));
    }

    this.nodeCounter++;

    this.graphService.addNode(node);
  }

  deleteNode(node: GraphNode) {
    this.graphService.removeNode(node);
  }

  nodeMoved(node: GraphNode, position: Position) {
    this.graphService.moveNode(node, position);
  }

}
