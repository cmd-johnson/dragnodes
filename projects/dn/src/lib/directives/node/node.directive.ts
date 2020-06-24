import { Directive, Input, Output, EventEmitter, HostBinding, OnDestroy, AfterViewInit, ElementRef, ContentChildren, QueryList } from '@angular/core';
import interact from 'interactjs';
import { Subject, Observable } from 'rxjs';
import { scan, takeUntil, startWith, distinctUntilChanged, throttleTime, share, pairwise, filter, mapTo, map } from 'rxjs/operators';
// import { NodePortDirective } from '../node-port/node-port.directive';
import { GraphComponent } from '../../components/graph/graph.component';

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

interface Pos {
  x: number;
  y: number;
}

interface DragEvent {
  delta: Pos;
}

type NodePositionAction = MoveNodeAction | SetNodePositionAction;

@Directive({
  selector: '[dnNode]'
})
export class NodeDirective<OutputKey, InputKey> implements AfterViewInit, OnDestroy {
  /** Emits when all subscriptions should be dropped at the end of the component's lifecycle. */
  private unsubscribe = new Subject();

  private nodePositionActions = new Subject<NodePositionAction>();

  // @ContentChildren(NodePortDirective, { descendants: true })
  // ports: QueryList<NodePortDirective<OutputKey, InputKey>>;
  @ContentChildren('[dnNodeInput], [dnNodeOutput]', { descendants: true })
  ports: QueryList<HTMLElement>;

  @HostBinding('style.transform')
  cssTransform: string;

  @HostBinding('style.transform.translate')
  cssTranslate: string;

  @HostBinding('style.position')
  cssPosition = 'absolute';

  @HostBinding('style.top')
  cssTop: string;

  @HostBinding('style.left')
  cssLeft: string;

  public $portPositionsInvalidated = new Subject();

  @Input()
  public set nodePos({ x, y }: Pos) {
    this.nodePositionActions.next({ type: 'set', x, y });
  }

  public nodePosition: Pos;

  @Output()
  nodePosChange = new EventEmitter<Pos>();

  public $nodeMoved: Observable<{ dx: number, dy: number }>;

  public get clientPos(): Pos {
    const { top: y, left: x } = (this.element.nativeElement as HTMLElement).getBoundingClientRect();
    return { x, y };
  }

  constructor(
    private graph: GraphComponent<OutputKey, InputKey>,
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
      throttleTime(1000 / 60, undefined, { leading: true, trailing: true }),
      takeUntil(this.unsubscribe)
    ).subscribe(({ x, y }) => {
      this.nodePosition = { x, y };
      this.cssTransform = `translate(${x}px, ${y}px)`;
      // this.cssLeft = `${x}px`;
      // this.cssTop = `${y}px`;
    });

    nodePos.pipe(
      takeUntil(this.unsubscribe)
    ).subscribe(this.nodePosChange);

    this.$nodeMoved = nodePos.pipe(
      pairwise(),
      filter(([a, b]) => a.x !== b.x || a.y !== b.y),
      map(([a, b]) => ({ dx: b.x - a.x, dy: b.y - a.y })),
      share(),
      takeUntil(this.unsubscribe)
    );

    /*nodePos.pipe(
      pairwise(),
      filter(([a, b]) => a.x !== b.x || a.y !== b.y),
      takeUntil(this.unsubscribe)
    ).subscribe(([a, b]) => {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      if (this.ports) {
        this.ports.forEach(p => p.movePortRect(dx, dy));
      }
    });*/
  }

  ngAfterViewInit(): void {
    this.ports.changes.subscribe(() => console.log('node ports changed', this.ports.toArray()));
    interact(this.element.nativeElement).draggable({
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: 'parent'
        })
      ],
      autoScroll: true,
      onmove: ({ delta: { x, y }}: DragEvent) => this.nodePositionActions.next({ type: 'move', dx: x, dy: y })
    });

    this.ports.changes.pipe(
      mapTo(void 0),
      takeUntil(this.unsubscribe)
    ).subscribe(this.$portPositionsInvalidated);
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
