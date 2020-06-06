import { Directive, AfterViewInit, OnDestroy, ElementRef, HostBinding, Input, Output, EventEmitter } from '@angular/core';
import interact from 'interactjs';
import { Subject } from 'rxjs';
import { takeUntil, scan, startWith, distinctUntilChanged, throttleTime } from 'rxjs/operators';

interface MoveNodeAction {
  type: 'move';
  dx: number;
  dy: number;
}

interface SetNodePositionAction {
  type: 'set';
  x?: number;
  y?: number;
}

type NodePositionAction = MoveNodeAction | SetNodePositionAction;

@Directive({
  selector: '[dnNode]'
})
export class NodeDirective implements AfterViewInit, OnDestroy {
  /** Emits when all subscriptions should be dropped at the end of the component's lifecycle. */
  private unsubscribe = new Subject();

  private nodePositionActions = new Subject<NodePositionAction>();

  @Input()
  public set nodePosition(value: { x: number, y: number }) {
    this.nodePositionActions.next({
      type: 'set',
      x: value.x,
      y: value.y
    });
  }

  @Output()
  public nodePositionChange = new EventEmitter<{ x: number, y: number}>();

  // @HostBinding('style.transform')
  // elementTransform: string;

  @HostBinding('style.top')
  elementTop: string;

  @HostBinding('style.left')
  elementLeft: string;

  constructor(
    private element: ElementRef
  ) {
    const initialPosition = { x: 0, y: 0 };
    const nodePos = this.nodePositionActions.pipe(
      scan(this.nodePosActionReducer, initialPosition)
    );

    nodePos.pipe(
      startWith(initialPosition),
      distinctUntilChanged((a, b) => a.x === b.x || a.y === b.y),
      throttleTime(1000 / 60, undefined, { leading: true, trailing: true }),
      takeUntil(this.unsubscribe)
    ).subscribe(({ x, y }) => {
      // this.elementTransform = `translate(${x}px, ${y}px)`;
      console.log('setting node position');
      this.elementLeft = `${x}px`;
      this.elementTop = `${y}px`;
    });

    nodePos.pipe(
      takeUntil(this.unsubscribe)
    ).subscribe(this.nodePositionChange);
  }

  private nodePosActionReducer(pos: { x: number, y: number }, action: NodePositionAction) {
    switch (action.type) {
      case 'set':
        return {
          x: action.x !== undefined ? action.x : pos.x,
          y: action.y !== undefined ? action.y : pos.y
        };
      case 'move':
        return {
          x: pos.x + action.dx,
          y: pos.y + action.dy
        };
    }
  }

  ngAfterViewInit(): void {
    const interactable = interact(this.element.nativeElement);

    interactable.draggable({
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: 'parent',
          endOnly: true
        })
      ],
      autoScroll: true,
      onmove: e => {
        this.nodePositionActions.next({ type: 'move', dx: e.delta.x, dy: e.delta.y });
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

}
