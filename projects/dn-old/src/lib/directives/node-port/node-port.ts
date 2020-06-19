import { ElementRef, AfterViewInit, OnDestroy, Input, Directive } from '@angular/core';
import interact from 'interactjs';
import { Subject } from 'rxjs';
import { Position } from '../../data/position';
import { NodeDirective } from '../node/node.directive';

export interface DragEvent<PortKey> {
  startedFrom: PortKey;
  client: { x: number, y: number };
}

interface MoveEvent {
  interaction: Interact.Interaction;
  interactable: Interact.Interactable;
}

export interface PortDragEvent<PortKey> {
  type: 'start' | 'drag' | 'end';
  draggedPort: PortKey;
  cursorClientPosition: Position;
}

export interface PortDropEvent<PortKey> {
  draggedFrom: PortKey;
  droppedOn: PortKey;
}

class InvalidPortConfigurationError extends Error {
  constructor(htmlElement: HTMLElement) {
    console.error('Invalid Port configuration', htmlElement);
    super('A node port cannot be both an input and an output at the same time');
  }
}

@Directive({
  selector: '[dnNodeInput], [dnNodeOutput]'
})
export class NodePortDirective<PortKey> implements AfterViewInit, OnDestroy {
  /** Emits when all subscriptions should be dropped at the end of the component's lifecycle. */
  private unsubscribe = new Subject();

  @Input()
  trackPortBy: PortKey;

  @Input('dnNodeInput')
  inputPort = false;

  get isInput(): boolean {
    return this.inputPort !== false;
  }

  @Input('dnNodeOutput')
  outputPort = false;

  get isOutput(): boolean {
    return this.outputPort !== false;
  }

  public beginInteraction = new Subject<Interact.Interaction>();
  public dragEvents = new Subject<PortDragEvent<PortKey>>();
  public droppedHere = new Subject<PortDropEvent<PortKey>>();

  public get htmlElement(): HTMLElement { return this.element.nativeElement; }
  public get centerPosition() {
    const bounds = this.htmlElement.getBoundingClientRect();
    return {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2
    };
  }

  protected interactable: Interact.Interactable;

  constructor(
    private element: ElementRef,
    private parentNode: NodeDirective
  ) {
    //console.log(parentNode);
  }

  ngAfterViewInit() {
    if (this.isInput === this.isOutput) {
      throw new InvalidPortConfigurationError(this.htmlElement);
    }

    this.interactable = interact(this.htmlElement);

    const emitDragEvent = (baseEvent: DragEvent<PortKey>, type: PortDragEvent<PortKey>['type']) => {
      this.dragEvents.next({ type, draggedPort: this.trackPortBy, cursorClientPosition: { ...baseEvent.client } });
    };

    this.interactable.draggable({
      manualStart: true,
      autoScroll: true,
      onstart: (event: DragEvent<PortKey>) => {
        emitDragEvent(event, 'start');
      },
      onmove: (event: DragEvent<PortKey>) => {
        emitDragEvent(event, 'drag');
      },
      onend: (event: DragEvent<PortKey>) => {
        // Adding the droppedFrom property to the event makes it appear in the dropzone's ondrop event.
        event.startedFrom = this.trackPortBy;
        emitDragEvent(event, 'end');
      }
    });
    this.interactable.on('move', (e: MoveEvent) => {
      if (e.interaction.pointerIsDown && !e.interaction.interacting()) {
        this.beginInteraction.next(e.interaction);
      }
    });

    this.interactable.dropzone({
      ondrop: ({ dragEvent }: { dragEvent: DragEvent<PortKey> }) => {
        this.droppedHere.next({
          draggedFrom: dragEvent.startedFrom,
          droppedOn: this.trackPortBy
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  startDrag(interaction: Interact.Interaction) {
    interaction.start({ name: 'drag' }, this.interactable, this.htmlElement);
  }
}
