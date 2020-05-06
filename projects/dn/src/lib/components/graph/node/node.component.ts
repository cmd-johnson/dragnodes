import { Component, Input, Output, EventEmitter, ElementRef, AfterViewInit, OnDestroy, HostBinding, ViewChildren, QueryList } from '@angular/core';
import { GraphNode } from '../../../data/graph-types';
import { Position } from '../../../data/position';
import { NodePortDirective } from '../../../directives/node-port/node-port.directive';
import { Subject, ReplaySubject } from 'rxjs';
import interact from 'interactjs';
import { takeUntil, withLatestFrom, map, tap } from 'rxjs/operators';
import { PortComponent } from './port/port.component';
import { GraphConnectionsService } from '../../../services/graph-connections/graph-connections.service';

interface NodeDraggedEvent {
  dx: number;
  dy: number;
}

export interface ConnectionDraggedEvent {
  from: NodePortDirective;
  to: Position;
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
  connectionDragged = new EventEmitter<ConnectionDraggedEvent>();

  @Output()
  deleteNode = new EventEmitter();

  @HostBinding('style.transform')
  private transform: string;

  @ViewChildren(PortComponent)
  private childPortComponents: QueryList<PortComponent>;

  private nodeDragged = new Subject<NodeDraggedEvent>();
  private nodePosition = new ReplaySubject<Position>(1);

  constructor(
    private element: ElementRef,
    graphConnections: GraphConnectionsService
  ) {
    this.nodeDragged.pipe(
      withLatestFrom(this.nodePosition),
      map(([delta, pos]) => ({ x: pos.x + delta.dx, y: pos.y + delta.dy })),
      takeUntil(this.unsubscribe)
    ).subscribe(this.nodePosition);

    this.nodePosition.pipe(
      tap(() => graphConnections.nodeMoved()),
      takeUntil(this.unsubscribe)
    ).subscribe(({ x, y }) => {
      this.transform = `translate(${x}px, ${y}px)`;
    });

    this.setPosition(0, 0);
  }

  setPosition(x: number, y: number) {
    this.nodePosition.next({ x, y });
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
        this.childPortComponents.forEach(p => p.nodePositionChanged());
      }
    });

    int.on('doubletap', () => this.deleteNode.next());
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
