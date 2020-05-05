import { Component, OnInit } from '@angular/core';
import { Node, Source, Sink, DragConnection, Connection } from '../../data/graph-types';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { PortDragEvent, ReceivedDropEvent } from '../../directives/node-port/node-port.directive';

@Component({
  selector: 'dn-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnInit {

  nodes: Node[] = [];
  private connections: Connection[] = [];
  private dragConnection?: DragConnection;

  private nodeCounter = 0;

  constructor() { }

  ngOnInit(): void {
  }

  addNode() {
    let node: Node;
    switch (this.nodeCounter % 5) {
      case 0:
        node = new Node(`Node #${this.nodeCounter} (source)`);
        node.addSources(new Source('source', new BehaviorSubject(`hello from ${this.nodeCounter}`)));
        break;
      case 1:
      case 2:
      case 3: {
        node = new Node(`Node #${this.nodeCounter} (transformer)`);
        const sink = new Sink('sink');
        const sourceObservable = sink.subject.pipe(map(v => `${v} → ${this.nodeCounter}`));
        const source = new Source('source', sourceObservable);

        node.addSources(source);
        node.addSinks(new Sink('sink'));

        break;
      }
      default: {
        node = new Node(`Node #${this.nodeCounter} (sink)`);
        const sink = new Sink('sink');
        sink.subject.subscribe(v => console.log(`Node #${this.nodeCounter}: ${v}`));
        node.addSinks(sink);
      }
    }
    this.nodeCounter++;

    this.nodes.push(node);
  }

  onPortDragged(event: PortDragEvent) {
    console.log('dragged', event);
  }

  onPortDropped(event: PortDragEvent) {
    console.log('dropped', event);
  }

  onPortReceivedConnection(event: ReceivedDropEvent) {
    console.log(event.from, 'dropped on', event.port);
  }

}
