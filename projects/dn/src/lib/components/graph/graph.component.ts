import { Component, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

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

  private nodeCounter = 0;

  constructor(
    private graphService: GraphService
  ) {
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
    let node: GraphNode;
    switch (this.nodeCounter % 5) {
      case 0:
        node = new GraphNode(`Node #${this.nodeCounter} (source)`);
        node.addOutputs(new OutputPort('source', new BehaviorSubject(`hello from ${node.name}`)));
        break;
      case 1:
      case 2:
      case 3: {
        node = new GraphNode(`Node #${this.nodeCounter} (transformer)`);
        const input = new InputPort('sink');
        const outputObservable = input.subject.pipe(map(v => `${v} → ${this.nodeCounter}`));
        const output = new OutputPort('source', outputObservable);

        node.addOutputs(output);
        node.addInputs(new InputPort('sink'));

        break;
      }
      default: {
        node = new GraphNode(`Node #${this.nodeCounter} (sink)`);
        const input = new InputPort('sink');
        input.subject.subscribe(v => console.log(`Node #${this.nodeCounter}: ${v}`));
        node.addInputs(input);
      }
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
