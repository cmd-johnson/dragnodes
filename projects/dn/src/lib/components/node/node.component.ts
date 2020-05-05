import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Sink, Source } from '../../data/graph-types';
import { PortDragEvent, ReceivedDropEvent } from '../../directives/node-port/node-port.directive';

@Component({
  selector: 'dn-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss']
})
export class NodeComponent implements OnInit {

  @Input()
  title = '[no title]';

  @Input()
  inputs: Sink[] = [];

  @Input()
  outputs: Source[] = [];

  @Output()
  portDragged = new EventEmitter<PortDragEvent>();

  @Output()
  portDropped = new EventEmitter<PortDragEvent>();

  @Output()
  connectionReceived = new EventEmitter<ReceivedDropEvent>();

  constructor() { }

  ngOnInit(): void {
  }

  onPortDragged(event: PortDragEvent) {
    this.portDragged.next(event);
  }

  onPortDropped(event: PortDragEvent) {
    this.portDropped.next(event);
  }

  onConnectionReceived(event: ReceivedDropEvent) {
    this.connectionReceived.next(event);
  }

}
