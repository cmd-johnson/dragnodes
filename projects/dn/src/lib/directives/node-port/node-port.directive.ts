import { Directive, ElementRef, Input, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import interact from 'interactjs';
import { Subject, EMPTY, ReplaySubject } from 'rxjs';
import { map, switchMap, takeUntil, filter } from 'rxjs/operators';

import { Port } from '../../data/graph-types';
import { GraphService } from '../../services/graph/graph.service';
import { ResolvePortService } from '../../services/resolve-port/resolve-port.service';

interface DragEvent {
  originPort: Port;
  client: { x: number, y: number };
}

interface MoveEvent {
  interaction: Interact.Interaction;
  interactable: Interact.Interactable;
}

@Directive({
  selector: '[dnNodePort]'
})
export class NodePortDirective implements AfterViewInit, OnDestroy {
  /** Emits when all subscriptions should be dropped at the end of the component's lifecycle. */
  private unsubscribe = new Subject();

  @Input()
  port: Port;

  private moveEvents = new Subject<MoveEvent>();
  private dragging = new ReplaySubject<boolean>();
  private dragEvents = new Subject<DragEvent>();

  public get htmlElement() { return this.element.nativeElement; }

  @HostListener('mousedown') onMouseDown() {
    console.log('down: PORT');
  }

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

    this.moveEvents.pipe(
      filter(({ interaction }) => interaction.pointerIsDown && !interaction.interacting()),
      takeUntil(this.unsubscribe)
    ).subscribe(({ interaction, interactable }) => graphService.startPortConnectionDrag(this.port, interaction, interactable));
  }

  ngAfterViewInit() {
    const int = interact(this.htmlElement);

    int.draggable({
      manualStart: true,
      autoScroll: true,
      onstart: (e: DragEvent) => {
        this.dragging.next(true);
        this.dragEvents.next(e);
      },
      onmove: (e: DragEvent) => {
        this.dragEvents.next(e);
      },
      onend: (e: DragEvent) => {
        // Adding the originPort property to the event makes it appear in the dropzone's ondrop event.
        e.originPort = this.port;
        this.dragging.next(false);
      }
    });
    int.on('move', (e: MoveEvent) => {
      console.log(e);
      this.moveEvents.next(e);
    });

    int.dropzone({
      ondrop: e => {
        const dragEvent = e.dragEvent as DragEvent;
        const other = dragEvent.originPort;
        this.graphService.connectPorts(this.port, other);
      }
    });

    int.on('dragend', e => {
      console.log(e);
    });

    this.resolvePortService.registerPort(this.port, this);
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();

    this.resolvePortService.deregisterPort(this.port);
  }

  startDrag(interaction: Interact.Interaction, interactable: Interact.Interactable) {
    interaction.start({ name: 'drag' }, interactable, this.htmlElement);
  }
}
