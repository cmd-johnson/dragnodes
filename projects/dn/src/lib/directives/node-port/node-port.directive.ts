import { Directive, ElementRef, Input, AfterViewInit, OnDestroy } from '@angular/core';
import interact from 'interactjs';
import { Subject, BehaviorSubject, EMPTY } from 'rxjs';
import { map, switchMap, takeUntil, filter } from 'rxjs/operators';

import { Port, InputPort, OutputPort } from '../../data/graph-types';
import { GraphService } from '../../services/graph/graph.service';
import { ResolvePortService } from '../../services/resolve-port/resolve-port.service';

@Directive({
  selector: '[dnNodePort]'
})
export class NodePortDirective implements AfterViewInit, OnDestroy {
  /** Emits when all subscriptions should be dropped at the end of the component's lifecycle. */
  private unsubscribe = new Subject();

  @Input()
  port: Port;

  private dragging = new BehaviorSubject(false);
  private dragEvents = new Subject<any>();

  constructor(
    private element: ElementRef,
    private graphService: GraphService,
    private resolvePortService: ResolvePortService
  ) {
    const dragEvents = this.dragEvents.pipe(map(e => ({
      cursorPos: {
        x: e.client.x,
        y: e.client.y
      }
    })));

    this.dragging.pipe(
      switchMap(d => d ? dragEvents : EMPTY),
      takeUntil(this.unsubscribe)
    ).subscribe(({ cursorPos }) => graphService.dragPortConnection(this.port, cursorPos));

    this.dragging.pipe(
      filter(d => !d),
      takeUntil(this.unsubscribe)
    ).subscribe(() => graphService.releasePortConnection(this.port));
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
        if (other instanceof InputPort && this.port instanceof OutputPort) {
          this.graphService.connectPorts(this.port, other);
        } else if (other instanceof OutputPort && this.port instanceof InputPort) {
          this.graphService.connectPorts(other, this.port);
        }
      }
    });

    this.resolvePortService.registerPort(this.port, this.element.nativeElement);
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();

    this.resolvePortService.deregisterPort(this.port);
  }
}
