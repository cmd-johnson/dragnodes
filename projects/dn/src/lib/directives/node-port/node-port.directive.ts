import { Directive, Input, ElementRef, AfterViewInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import interact from 'interactjs';

import { Pos } from '../../data/pos';
import { NodeDirective } from '../node/node.directive';
import { PortRegistryService } from '../../services/port-registry/port-registry.service';
import { DraggedConnectionsService } from '../../services/dragged-connections/dragged-connections.service';
import { Rect } from '../../data/rect';

/** Partial type of move events from interactjs. */
interface InteractMoveEvent {
  interaction: Interact.Interaction;
}

/** Partial type of drag events from interactjs. */
interface InteractDragEvent {
  client: Pos;
}

/** Partial type of move events from interactjs with attached custom output data. */
const outputSymbol = Symbol('DN Output Key');
interface InteractOutputDragEndEvent<OutputKey> {
  [outputSymbol]: OutputKey;
}

/** Partial type of move events from interactjs with attached custom input data. */
const inputSymbol = Symbol('DN Input Key');
interface InteractInputDragEndEvent<InputKey> {
  [inputSymbol]: InputKey;
}

type InteractDragEndEvent<PortKey>
  = InteractOutputDragEndEvent<PortKey>
  | InteractInputDragEndEvent<PortKey>
  ;

type OutputOrInput<PortKey> = ({ output: PortKey } | { input: PortKey });

/** Symbol used to determine if @Input properties were never assigned to. */
const unassignedSymbol = Symbol('not assigned');

@Directive({
  selector: '[dnOutput], [dnInput]'
})
export class NodePortDirective<PortKey> implements AfterViewInit, OnDestroy {
  /** Emits when all subscriptions should be dropped at the end of the component's lifecycle. */
  private unsubscribe = new Subject();

  /**
   * Captures the output key when the directive is used as [dnOutput]="key".
   *
   * The key
   * - *must* be unique in this dn-graph or you'll run into issues.
   * - *must* never be re-assigned, or you risk breaking the dn-graph.
   * - is compared using `===`, so if you are using non-primitive types, make
   *   sure you only ever use the exact instance of the key in the
   *   `getDragOriginPort` method and dn-connections, or your connections will
   *   misbehave.
   *
   * Using [dnOutput] marks this directive as an output port, meaning it will
   * only accept connections from [dnInput]s.
   */
  @Input('dnOutput')
  outputKey: PortKey | typeof unassignedSymbol = unassignedSymbol;

  /**
   * True when [dnOutput] was used to apply this directive to an element.
   */
  get isOutput(): boolean {
    return this.outputKey !== unassignedSymbol;
  }

  /**
   * Captures the input key when the directive is used as [dnInput]="key".
   *
   * Using [dnInput] marks this directive as an input port, meaning it only accepts connections from [dnOutput]s.
   */
  @Input('dnInput')
  inputKey: PortKey | typeof unassignedSymbol = unassignedSymbol;

  /**
   * True when [dnInput] was used to apply this directive to an element.
   */
  get isInput(): boolean {
    return this.inputKey !== unassignedSymbol;
  }

  private portKeyCache?: PortKey = null;
  /** Returns the input or output key, depending on which one was set. */
  get portKey(): PortKey {
    return this.portKeyCache || (this.portKeyCache = (this.isOutput ? this.outputKey : this.inputKey) as PortKey);
  }

  /**
   * Use this callback to tell the port from which port to start the connection drag.
   *
   * Usually, you'll want to check if this port is connected to somewhere and
   * if so, start the drag drom the port this port ist connected *to*. If this
   * port does not have a connection, then just return this port's key to start
   * the connection here.
   *
   * Return `false` if you do not want to allow to dragg a connection from here.
   *
   * Example usage:
   * ```html
   * <!-- in example.component.html: -->
   * <div *ngFor="let i of node.inputs" [dnInput]="i.id" [getDragOriginPort]="getDragOriginPort">
   *   <!-- ... -->
   * </div>
   * ```
   *
   * ```ts
   * // in example.component.ts:
   * getDragOriginPort(port: { output: OutputKey } | { input: InputKey }): { output: OutputKey } | { input: InputKey } | false {
   *   if ('output' in port) {
   *     if (/* port.output is connected to an input *\/) {
   *       return { input: /* the key of the input port.output is connected to *\/ };
   *     }
   *   } else if (/* port.input is connected to an output *\/) {
   *     return { output: /* the key of the output port.input is connected to *\/ };
   *   }
   *   return port;
   *   // You could also return `false` to disallow dragging from the port.
   * }
   * ```
   */
  @Input()
  getDragOriginPort: (port: OutputOrInput<PortKey>) => OutputOrInput<PortKey> | false = (() => false as false);

  /**
   * Triggers when a drag was started from this port.
   *
   * Use this event to disconnect the port from any port is was previously
   * connected to.
   *
   * Only is triggered after `getDragOriginPort(...)` returned something other
   * than `false`.
   */
  @Output()
  dragStarted = new EventEmitter();

  /**
   * Use this callback to determine if a connect event should be sent or not.
   *
   * This callback is called when a drag started on a port is dropped onto this
   * port and their port types differ (i.e. one of the ports is an output and
   * the other one is an input).
   *
   * @param output - the key of the dnOutput of the potential connection
   * @param input - the key of the dnInput of the potential connection
   * @returns true if the connection would be valid and a connect event should
   *          be triggered
   */
  @Input()
  canConnect: (output: PortKey, input: PortKey) => boolean = (() => false);

  /**
   * Triggers when a dragged connection was dropped on this port.
   *
   * Use this event to connect this port to the emitted port.
   * If this port is a dnInput, the event always will be an OutputKey and if
   * this port is a dnOutput, the event will always be an InputKey.
   *
   * Only is triggered after `canConnect(...)` returned true and the ports
   * involved are of opposite types (one input and one output).
   */
  @Output()
  connect = new EventEmitter<{ output: PortKey, input: PortKey }>();

  /**
   * The interactjs Interactable associated with this directive's host element.
   *
   * Used to start and receive drags.
   */
  private interactable: Interact.Interactable;

  /** The rect of the port relative to the top left corner of its containing node. */
  public relativePortRect: Rect;

  constructor(
    public node: NodeDirective,
    private elementRef: ElementRef,
    private portRegistry: PortRegistryService<PortKey>,
    private draggedConnections: DraggedConnectionsService<PortKey>
  ) { }

  ngAfterViewInit(): void {
    if (this.isOutput === this.isInput) {
      throw new Error('A node port cannot be an input and output at the same time. Use either [dnOutput] or [dnInput], not both.');
    }

    // Recalculate position and size when the parent node changed
    this.node.$viewInvalidated.pipe(takeUntil(this.unsubscribe)).subscribe(() => this.invalidateView());
    this.invalidateView();

    // Register this port with its key at the portRegistry for fast lookup
    this.portRegistry.registerPort(this.portKey, this);

    this.interactable = interact(this.elementRef.nativeElement);

    // Handle drag events
    this.interactable.draggable({
      manualStart: true,
      autoScroll: true,
      onstart: (event: InteractDragEvent) => {
        if (this.isInput) {
          this.draggedConnections.startInputDrag(this.portKey, { ...event.client });
        } else {
          this.draggedConnections.startOutputDrag(this.portKey, { ...event.client });
        }
      },
      onmove: (event: InteractDragEvent) => {
        if (this.isInput) {
          this.draggedConnections.dragInput(this.portKey, { ...event.client });
        } else {
          this.draggedConnections.dragOutput(this.portKey, { ...event.client });
        }
      },
      onend: (event: InteractDragEndEvent<PortKey>) => {
        if (this.isInput) {
          this.draggedConnections.endInputDrag(this.portKey);
          event[inputSymbol] = this.portKey;
        } else {
          this.draggedConnections.endOutputDrag(this.portKey);
          event[outputSymbol] = this.portKey;
        }
      }
    });

    this.interactable.on('move', (event: InteractMoveEvent) => {
      if (event.interaction.pointerIsDown && !event.interaction.interacting()) {
        const portKey = this.isInput ? { input: this.portKey } : { output: this.portKey };
        const dragOrigin = this.getDragOriginPort(portKey);
        if (dragOrigin !== false) {
          const startPort = this.portRegistry.getPort('input' in dragOrigin ? dragOrigin.input : dragOrigin.output);
          startPort.startDrag(event.interaction);
        }
      }
    });

    // Allow dropping stuff on this port
    this.interactable.dropzone({
      ondrop: ({ dragEvent }: { dragEvent: InteractDragEndEvent<PortKey> }) => {
        if (inputSymbol in dragEvent && this.isOutput) {
          if (this.canConnect(this.portKey, dragEvent[inputSymbol])) {
            this.connect.next({ output: this.portKey, input: dragEvent[inputSymbol] });
          }
        } else if (outputSymbol in dragEvent && this.isInput) {
          if (this.canConnect(dragEvent[outputSymbol], this.portKey)) {
            this.connect.next({ output: dragEvent[outputSymbol], input: this.portKey });
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.portRegistry.unregisterPort(this.portKey);

    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  /** Starts a drag event. */
  private startDrag(interaction: Interact.Interaction) {
    interaction.start({ name: 'drag' }, this.interactable, this.elementRef.nativeElement);
    this.dragStarted.emit();
  }

  /** Recalculates the relative position of the port within its containing node. */
  private invalidateView() {
    const { x: nx, y: ny } = this.node.clientPos;
    const { left, top, width, height } = (this.elementRef.nativeElement as HTMLElement).getBoundingClientRect();
    this.relativePortRect = {
      x: left - nx, y: top - ny,
      width, height
    };
  }
}
