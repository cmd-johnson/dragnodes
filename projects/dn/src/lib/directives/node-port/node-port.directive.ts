import { Directive, ElementRef, OnInit, Output, EventEmitter, Input } from '@angular/core';
import interact from 'interactjs';
import { Source, Sink } from '../../data/graph-types';

export interface PortDragEvent {
  distance: { x: number, y: number };
  startPort: Source | Sink;
  element: HTMLElement;
}

export interface ReceivedDropEvent {
  from: HTMLElement;
  port: Source | Sink;
}

@Directive({
  selector: '[dnNodePort]'
})
export class NodePortDirective implements OnInit {

  @Input()
  port: Source | Sink;

  @Output()
  readonly dragged = new EventEmitter<PortDragEvent>();

  @Output()
  readonly dropped = new EventEmitter<PortDragEvent>();

  @Output()
  readonly incomingDrop = new EventEmitter<ReceivedDropEvent>();

  constructor(
    private element: ElementRef
  ) { }

  ngOnInit(): void {
    const self = this;
    const interactable = interact(this.element.nativeElement);
    interactable['port'] = this;
    interactable.draggable({
      cursorChecker(_, __, ___, interacting) {
        return interacting ? 'move' : 'pointer';
      },
      modifiers: [
      ],
      inertia: false,
      onstart: e => {
        this.dragged.next({
          distance: { x: 0, y: 0 },
          startPort: this.port,
          element: e.currentTarget
        });
        e.test = { start: this };
      },
      onmove: e => {
        this.dragged.next({
          distance: e.delta,
          startPort: this.port,
          element: e.currentTarget
        });
        e.test = { move: this };
      },
      onend: e => {
        this.dropped.next({
          distance: e.delta,
          startPort: this.port,
          element: e.currentTarget,
          event: e
        } as any);
        e.test = { end: this };
      }
    });
    interactable.dropzone({
      ondrop: e => {
        console.log(e);
        this.incomingDrop.next({
          from: e.relatedTarget,
          port: this.port
        });
      }
    });
  }

}
