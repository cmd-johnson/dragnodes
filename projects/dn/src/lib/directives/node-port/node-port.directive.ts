import { Directive, Input, ElementRef, AfterViewInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import interact from 'interactjs';
import { PortRegistryService } from '../../services/port-registry/port-registry.service';
import { DraggedConnectionsService } from '../../services/dragged-connections/dragged-connections.service';
import { NodeDirective } from '../node/node.directive';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface InteractMoveEvent {
  interaction: Interact.Interaction;
}

interface InteractDragEvent {
  client: { x: number, y: number };
}

const outputSymbol = Symbol('DN Output Key');
interface InteractOutputDragEndEvent<OutputKey> {
  [outputSymbol]: OutputKey;
}

const inputSymbol = Symbol('DN Input Key');
interface InteractInputDragEndEvent<InputKey> {
  [inputSymbol]: InputKey;
}

type InteractDragEndEvent<OutputKey, InputKey>
  = InteractOutputDragEndEvent<OutputKey>
  | InteractInputDragEndEvent<InputKey>
  ;

type OutputOrInput<OutputKey, InputKey> = ({ output: OutputKey } | { input: InputKey });

const unassignedSymbol = Symbol('not assigned');

@Directive({
  selector: '[dnOutput], [dnInput]'
})
export class NodePortDirective<OutputKey, InputKey> implements AfterViewInit, OnDestroy {
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
  outputKey: OutputKey | typeof unassignedSymbol = unassignedSymbol;

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
  inputKey: InputKey | typeof unassignedSymbol = unassignedSymbol;

  /**
   * True when [dnInput] was used to apply this directive to an element.
   */
  get isInput(): boolean {
    return this.inputKey !== unassignedSymbol;
  }

  private htmlRectCache: ClientRect | null = null;

  /**
   * Returns the client rect of the rendered element.
   *
   * Used to find the point at which to render connections that start or end on this port.
   */
  get htmlRect(): Readonly<ClientRect> {
    if (!this.htmlRectCache) {
      this.htmlRectCache = (this.elementRef.nativeElement as HTMLElement).getBoundingClientRect();
    }
    return this.htmlRectCache;
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
  getDragOriginPort: (port: OutputOrInput<OutputKey, InputKey>) => OutputOrInput<OutputKey, InputKey> | false = (() => false as false);

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
  canConnect: (output: OutputKey, input: InputKey) => boolean = (() => false);

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
  connect = new EventEmitter<{ output: OutputKey, input: InputKey }>();

  /**
   * The interactjs Interactable associated with this directive's host element.
   *
   * Used to start and receive drags.
   */
  private interactable: Interact.Interactable;

  constructor(
    private node: NodeDirective<OutputKey, InputKey>,
    private elementRef: ElementRef,
    private portRegistry: PortRegistryService<OutputKey, InputKey>,
    private draggedConnections: DraggedConnectionsService<OutputKey, InputKey>
  ) { }

  ngAfterViewInit(): void {
    if (this.isOutput === this.isInput) {
      throw new Error('A node port cannot be an input and output at the same time. Use either [dnOutput] or [dnInput], not both.');
    }

    // Register this port with its key at the portRegistry for fast lookup
    if (this.isOutput) {
      this.portRegistry.registerOutput(this.outputKey as OutputKey, this);
    } else if (this.isInput) {
      this.portRegistry.registerInput(this.inputKey as InputKey, this);
    }

    this.node.$portPositionsInvalidated.pipe(
      takeUntil(this.unsubscribe)
    ).subscribe(() => this.invalidatePosition());

    this.interactable = interact(this.elementRef.nativeElement);

    // Handle drag events
    this.interactable.draggable({
      manualStart: true,
      autoScroll: true,
      onstart: (event: InteractDragEvent) => {
        if (this.isInput) {
          this.draggedConnections.startInputDrag(this.inputKey as InputKey, { ...event.client });
        } else {
          this.draggedConnections.startOutputDrag(this.outputKey as OutputKey, { ...event.client });
        }
      },
      onmove: (event: InteractDragEvent) => {
        if (this.isInput) {
          this.draggedConnections.dragInput(this.inputKey as InputKey, { ...event.client });
        } else {
          this.draggedConnections.dragOutput(this.outputKey as OutputKey, { ...event.client });
        }
      },
      onend: (event: InteractDragEndEvent<OutputKey, InputKey>) => {
        if (this.isInput) {
          this.draggedConnections.endInputDrag(this.inputKey as InputKey);
          event[inputSymbol] = this.inputKey as InputKey;
        } else {
          this.draggedConnections.endOutputDrag(this.outputKey as OutputKey);
          event[outputSymbol] = this.outputKey as OutputKey;
        }
      }
    });

    this.interactable.on('move', (event: InteractMoveEvent) => {
      if (event.interaction.pointerIsDown && !event.interaction.interacting()) {
        const portKey = this.isInput ? { input: this.inputKey as InputKey } : { output: this.outputKey as OutputKey };
        const dragOrigin = this.getDragOriginPort(portKey);
        if (dragOrigin !== false) {
          let startPort: NodePortDirective<OutputKey, InputKey>;
          if ('input' in dragOrigin) {
            startPort = this.portRegistry.getInput(dragOrigin.input);
          } else {
            startPort = this.portRegistry.getOutput(dragOrigin.output);
          }
          startPort.startDrag(event.interaction);
        }
      }
    });

    // Allow dropping stuff on this port
    this.interactable.dropzone({
      ondrop: ({ dragEvent }: { dragEvent: InteractDragEndEvent<OutputKey, InputKey> }) => {
        if (inputSymbol in dragEvent && this.isOutput) {
          if (this.canConnect(this.outputKey as OutputKey, dragEvent[inputSymbol])) {
            this.connect.next({ output: this.outputKey as OutputKey, input: dragEvent[inputSymbol] });
          }
        } else if (outputSymbol in dragEvent && this.isInput) {
          if (this.canConnect(dragEvent[outputSymbol], this.inputKey as InputKey)) {
            this.connect.next({ output: dragEvent[outputSymbol], input: this.inputKey as InputKey });
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.isOutput) {
      this.portRegistry.unregisterOutput(this.outputKey as OutputKey);
    } else {
      this.portRegistry.unregisterInput(this.inputKey as InputKey);
    }

    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  private startDrag(interaction: Interact.Interaction) {
    interaction.start({ name: 'drag' }, this.interactable, this.elementRef.nativeElement);
    this.dragStarted.emit();
  }

  movePortRect(dx: number, dy: number) {
    const { top, right, bottom, left, width, height } = this.htmlRect;
    this.htmlRectCache = {
      right: right + dx, left: left + dx,
      top: top + dy, bottom: bottom + dy,
      width, height
    };
  }

  invalidatePosition() {
    this.htmlRectCache = null;
  }
}
