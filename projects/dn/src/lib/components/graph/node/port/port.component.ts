import { Component, HostBinding, ElementRef, AfterViewInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import interact from 'interactjs';
import { Subject, BehaviorSubject, EMPTY, combineLatest } from 'rxjs';
import { Port } from 'projects/dn/src/lib/data/graph-types';
import { Position } from 'projects/dn/src/lib/data/position';
import { switchMap, map, takeUntil, tap, startWith, filter } from 'rxjs/operators';
import { GraphConnectionsService } from 'projects/dn/src/lib/services/graph-connections/graph-connections.service';

@Component({
  selector: 'dn-port',
  templateUrl: './port.component.html',
  styleUrls: ['./port.component.scss']
})
export class PortComponent implements AfterViewInit, OnDestroy {
  /** Emits when all subscriptions should be dropped at the end of the component's lifecycle. */
  private unsubscribe = new Subject();

  @Input()
  set color(color: string) {
    this.background = `radial-gradient(circle, transparent 50%, ${color} 51%)`;
  }

  @Input()
  port: Port;

  private dragging = new BehaviorSubject(false);
  private dragEvents = new Subject<any>();

  @Output()
  dragged = new EventEmitter<{ cursorPos: Position }>();

  @Output()
  released = new EventEmitter<Port>();

  private nodeMoved = new Subject();

  @HostBinding('style.background')
  private background: string;

  constructor(
    private element: ElementRef,
    private graphConnections: GraphConnectionsService
  ) {
    const dragEvents = combineLatest([this.dragEvents, this.nodeMoved.pipe(startWith(0))]).pipe(
      map(([dragEvent, _]) => ({
        cursorPos: {
          x: dragEvent.client.x,
          y: dragEvent.client.y
        }
      }))
    );
    this.dragging.pipe(
      switchMap(d => d ? dragEvents : EMPTY),
      takeUntil(this.unsubscribe),
      tap(({ cursorPos }) => graphConnections.dragConnection(this.port, cursorPos))
    ).subscribe(this.dragged);

    this.dragging.pipe(
      filter(d => !d),
      takeUntil(this.unsubscribe)
    ).subscribe(() => graphConnections.releaseConnection(this.port));
  }

  ngAfterViewInit() {
    const int = interact(this.element.nativeElement);

    int.draggable({
      autoScroll: true,
      onstart: () => this.dragging.next(true),
      onmove: e => this.dragEvents.next(e),
      onend: e => {
        // Adding the originPort property to the event makes it appear in the dropzone's ondrop event.
        e.originPort = this.port;
        this.dragging.next(false);
      }
    });

    int.dropzone({
      ondrop: e => {
        const other = e.dragEvent.originPort as Port;
        this.graphConnections.connect(this.port, other);
      }
    });

    this.graphConnections.registerPort(this.port, this.element.nativeElement);
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();

    this.graphConnections.deregisterPort(this.port);
  }

  nodePositionChanged() {
    this.nodeMoved.next();
  }
}
