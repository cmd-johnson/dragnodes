import { Component, Input, Output, EventEmitter, ElementRef, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import interact from 'interactjs';
import { Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

import { GraphNode } from '../../../data/graph-types';
import { Position } from '../../../data/position';

interface NodeDraggedEvent {
  dx: number;
  dy: number;
}

@Component({
  selector: 'dn-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss']
})
export class NodeComponent implements AfterViewInit, OnDestroy {
  /** Emits when all subscriptions should be dropped at the end of the component's lifecycle. */
  private unsubscribe = new Subject();

  @Input()
  node: GraphNode;

  @Output()
  deleteNode = new EventEmitter();

  @Output()
  nodeMoved = new EventEmitter<Position>();

  @HostListener('mousedown') onMouseDown() {
    console.log('down: NODE');
  }

  private nodeDragged = new Subject<NodeDraggedEvent>();

  constructor(
    private element: ElementRef
  ) {
    this.nodeDragged.pipe(
      map(delta => ({ x: this.node.position.x + delta.dx, y: this.node.position.y + delta.dy })),
      takeUntil(this.unsubscribe)
    ).subscribe(this.nodeMoved);
  }

  ngAfterViewInit(): void {
    const int = interact(this.element.nativeElement);

    // Emit drag events when dragging the node
    int.draggable({
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: 'parent',
          endOnly: false
        })
      ],
      autoScroll: true,
      onmove: e => {
        this.nodeDragged.next({ dx: e.delta.x, dy: e.delta.y });
      }
    });

    int.on('doubletap', () => this.deleteNode.next());
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
