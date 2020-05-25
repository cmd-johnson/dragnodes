import { Directive, ElementRef, Input, AfterViewInit, OnDestroy } from '@angular/core';
import interact from 'interactjs';
import { Subject, EMPTY, ReplaySubject } from 'rxjs';
import { map, switchMap, takeUntil, filter, withLatestFrom } from 'rxjs/operators';

import { Port, OutputPort, InputPort, isSameNode, isSamePort } from '../../data/graph-types';
import { GraphService } from '../../services/graph/graph.service';
import { ResolvePortService } from '../../services/resolve-port/resolve-port.service';
import { ConnectPortAction } from '../../services/graph/graph-actions';

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

  private connectedTo?: NodePortDirective = null;

  private interactable: Interact.Interactable;

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
    ).subscribe(({ interaction, interactable }) => {
      const startPort = this.connectedTo === null ? this : this.connectedTo;
      console.log('still connected to', this.connectedTo);
      startPort.startDrag(interaction, interactable);
    });

    graphService.actions.pipe(
      filter(({ type }) => type === 'connect port'),
      withLatestFrom(graphService.state),
      takeUntil(this.unsubscribe)
    ).subscribe(([ a, s ]) => {
      const { output, input } = a as ConnectPortAction;
      if (isSameNode(output.parent, input.parent)) {
        return;
      }
      if (output === this.port) {
        this.connectedTo = resolvePortService.getPortDirective(input);
      } else if (input === this.port) {
        this.connectedTo = resolvePortService.getPortDirective(output);
      }
    });

    graphService.actions.pipe(
      filter(a => a.type === 'disconnect port' && (isSamePort(a.input, this.port) || isSamePort(a.output, this.port))),
      takeUntil(this.unsubscribe)
    ).subscribe(() => this.connectedTo = null);

    graphService.actions.pipe(
      filter(a => a.type === 'remove node' && !!this.connectedTo && isSameNode(a.node, this.connectedTo.port.parent)),
      takeUntil(this.unsubscribe)
    ).subscribe(() => this.connectedTo = null);
  }

  ngAfterViewInit() {
    const int = interact(this.htmlElement);
    this.interactable = int;

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
        if (this.connectedTo) {
          if (this.port instanceof OutputPort) {
            this.graphService.disconnectPorts(this.port, this.connectedTo.port as InputPort);
          } else {
            this.graphService.disconnectPorts(this.connectedTo.port as OutputPort, this.port);
          }
        }
      }
    });
    int.on('move', (e: MoveEvent) => {
      this.moveEvents.next(e);
    });

    int.dropzone({
      ondragleave: console.log,
      ondrop: e => {
        const dragEvent = e.dragEvent as DragEvent;
        const other = dragEvent.originPort;
        if (this.port instanceof OutputPort && other instanceof InputPort) {
          this.graphService.connectPorts(this.port, other);
        } else if (this.port instanceof InputPort && other instanceof OutputPort) {
          this.graphService.connectPorts(other, this.port);
        }
      }
    });

    this.resolvePortService.registerPort(this.port, this);
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();

    this.resolvePortService.deregisterPort(this.port);
  }

  startDrag(interaction: Interact.Interaction, interactable: Interact.Interactable) {
    console.log('start drag', interaction, this.interactable, this.htmlElement);
    interaction.start({ name: 'drag' }, this.interactable, this.htmlElement);
  }
}
