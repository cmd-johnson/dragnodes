import { Directive, Input, Output, EventEmitter, HostBinding, OnDestroy, AfterViewInit, ElementRef } from '@angular/core';
import { Subject } from 'rxjs';
import { scan, takeUntil, startWith, distinctUntilChanged, throttleTime, share } from 'rxjs/operators';
import interact from 'interactjs';

import { Pos } from '../../data/pos';

interface MoveNodeAction {
  type: 'move';
  dx: number;
  dy: number;
}

interface SetNodePositionAction {
  type: 'set';
  x: number;
  y: number;
}

type NodePositionAction = MoveNodeAction | SetNodePositionAction;

@Directive({
  selector: '[dnNode]',
  exportAs: 'nodeDirective'
})
export class NodeDirective implements AfterViewInit, OnDestroy {
  /** Emits when all subscriptions should be dropped at the end of the component's lifecycle. */
  private unsubscribe = new Subject();

    /** Used to apply the node's position to the directive's element. */
  @HostBinding('style.transform')
  cssTransform: string;

  /**
   * Set the position style of the element this directive is applied to to 'absolute'.
   *
   * It's the only value that allows the node to be dragged as expected.
   */
  @HostBinding('style.position')
  cssPosition = 'absolute';

  /** Action subject used to change the node position. */
  private nodePositionActions = new Subject<NodePositionAction>();

  /** The node's position on the graph. */
  @Input()
  public set nodePos({ x, y }: Pos) {
    this.nodePositionActions.next({ type: 'set', x, y });
  }

  /** The node's position on the graph. */
  public get nodePos(): Pos {
    return this.nodePosition;
  }

  /** Emits when the node's position on the graph changed. */
  @Output()
  nodePosChange = new EventEmitter<Pos>();

  /** The node's position on the graph. */
  private nodePosition: Pos;

  /**
   * Emits when this node's invalidateView method was called and when the directive is first created.
   *
   * Used by NodePortDirectives to update their relative positions to the node.
   */
  public readonly $viewInvalidated = new Subject();

  /**
   * The node's position on the screen.
   *
   * Used by NodePortDirectives to determine their relative position to the node.
   */
  public get clientPos(): Pos {
    const { top: y, left: x } = (this.element.nativeElement as HTMLElement).getBoundingClientRect();
    return { x, y };
  }

  constructor(
    private element: ElementRef
  ) {
    const initialPosition = { x: 0, y: 0 };
    const nodePos = this.nodePositionActions.pipe(
      scan(({ x, y }, action) => {
        if (action.type === 'set') {
          return { x: action.x, y: action.y };
        } else {
          return { x: x + action.dx, y: y + action.dy };
        }
      }, initialPosition),
      share()
    );

    nodePos.pipe(
      startWith(initialPosition),
      distinctUntilChanged((a, b) => a.x === b.x && a.y === b.y),
      // Only update the node position up to 60 times per second
      throttleTime(1000 / 60, undefined, { leading: true, trailing: true }),
      takeUntil(this.unsubscribe)
    ).subscribe(({ x, y }) => {
      this.nodePosition = { x, y };
      this.cssTransform = `translate(${x}px, ${y}px)`;
    });

    nodePos.pipe(
      takeUntil(this.unsubscribe)
    ).subscribe(this.nodePosChange);
  }

  ngAfterViewInit(): void {
    interact(this.element.nativeElement).draggable({
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: 'parent'
        })
      ],
      autoScroll: true,
      onmove: ({ delta: { x, y }}: { delta: Pos }) => {
        this.nodePositionActions.next({ type: 'move', dx: x, dy: y })
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  /** Triggers re-calculation of connection start and end positions. */
  public invalidateView(): void {
    // The call has to be delayed, because otherwise the new layout may not
    // have been applied by the browser and connections would still render at
    // their old start and end points.
    setTimeout(() => this.$viewInvalidated.next());
  }
}
