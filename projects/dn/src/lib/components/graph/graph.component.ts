import {
  Component, AfterViewInit, OnDestroy,
  Input, Output,
  ViewChild, ContentChildren,
  TemplateRef, QueryList,
  EventEmitter,
  ChangeDetectorRef,
  ElementRef
} from '@angular/core';
import { PortRegistryService } from '../../services/port-registry/port-registry.service';
import { DraggedConnectionsService } from '../../services/dragged-connections/dragged-connections.service';
import { NodeDirective } from '../../directives/node/node.directive';
import { NodePortDirective } from '../../directives/node-port/node-port.directive';
import { Subject, bindCallback } from 'rxjs';
import { takeUntil, throttleTime, share } from 'rxjs/operators';

interface Pos {
  x: number;
  y: number;
}

interface DraggedConnection {
  from: Pos;
  to: Pos;
}

function getCenter(rect: { top: number, left: number, width: number, height: number }): Pos {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

@Component({
  selector: 'dn-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss'],
  providers: [
    PortRegistryService,
    DraggedConnectionsService
  ]
})
export class GraphComponent<OutputKey, InputKey> implements AfterViewInit, OnDestroy {
  /** Emits when all subscriptions should be dropped at the end of the component's lifecycle. */
  private unsubscribe = new Subject();

  @ViewChild('defaultConnectionSvg')
  private defaultConnectionSvg: TemplateRef<SVGElement>;

  @ContentChildren(NodePortDirective, { descendants: true })
  private childPorts: QueryList<NodeDirective<OutputKey, InputKey>>;

  @Input()
  connectionSvg: TemplateRef<SVGElement>;

  @Output()
  connectionAdded = new EventEmitter<{ from: any, to: any }>();

  get draggedConnections(): DraggedConnection[] {
    return [
      ...this.draggedConnectionsService.draggedOutputs.map(({ output, cursor }) => ({
        from: getCenter(this.portRegistry.getOutputRect(output)),
        to: { x: cursor.x + this.portRegistry.graphOffset.dx, y: cursor.y + this.portRegistry.graphOffset.dy }
      })),
      ...this.draggedConnectionsService.draggedInputs.map(({ input, cursor }) => ({
        from: { x: cursor.x + this.portRegistry.graphOffset.dx, y: cursor.y + this.portRegistry.graphOffset.dy },
        to: getCenter(this.portRegistry.getInputRect(input))
      }))
    ];
  }

  public get graphOffset(): { dx: number, dy: number } {
    const { top, left } = (this.element.nativeElement as HTMLElement).getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || 0;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    const offset = { dx: -left + scrollLeft, dy: -top + scrollTop };
    return offset;
  }

  constructor(
    private portRegistry: PortRegistryService<OutputKey, InputKey>,
    private draggedConnectionsService: DraggedConnectionsService<OutputKey, InputKey>,
    private element: ElementRef,
    private changeDetector: ChangeDetectorRef
  ) { }

  ngAfterViewInit(): void {
    if (!this.connectionSvg) {
      /*
       * Wait until the next change detection cycle to update the value to prevent
       * ExpressionChangedAfterItHasBeenCheckedErrors in development mode.
       */
      setTimeout(() => this.connectionSvg = this.defaultConnectionSvg);
    }

    // Manually trigger change detection to fix port connections not updating immediately when dynamically adding or removing ports
    this.childPorts.changes.pipe(
      takeUntil(this.unsubscribe)
    ).subscribe(() => setTimeout(() => this.changeDetector.detectChanges()));

    // const ownRect = (this.element.nativeElement as HTMLElement).getBoundingClientRect();
    // this.portRegistry.graphOffset = { dx: -ownRect.left, dy: -ownRect.top };
  }

  /**
   * Builds a bezier curve with a handle right of the output and one left of the input.
   */
  defaultConnectionPath(from: Pos, to: Pos): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const handleLength = Math.sqrt(dx * dx + dy * dy) / 2;
    return `M${from.x},${from.y} C${from.x + handleLength},${from.y} ${to.x - handleLength},${to.y} ${to.x},${to.y}`;
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
