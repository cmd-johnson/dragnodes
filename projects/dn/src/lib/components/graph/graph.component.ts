import { Component, AfterViewInit, OnDestroy, Input, ViewChild, TemplateRef, ElementRef } from '@angular/core';
import { Subject } from 'rxjs';

import { Pos } from '../../data/pos';
import { PortRegistryService } from '../../services/port-registry/port-registry.service';
import { DraggedConnectionsService } from '../../services/dragged-connections/dragged-connections.service';

@Component({
  selector: 'dn-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss'],
  providers: [
    PortRegistryService,
    DraggedConnectionsService
  ]
})
export class GraphComponent<PortKey> implements AfterViewInit, OnDestroy {
  /** Emits when all subscriptions should be dropped at the end of the component's lifecycle. */
  private unsubscribe = new Subject();

  /** Reference to the default SVG template used to render (dragged) connections. */
  @ViewChild('defaultConnectionSvg')
  private defaultConnectionSvg: TemplateRef<SVGElement>;

  /**
   * The SVG template used to render (dragged) connections.
   *
   * Per default, this template also be used by dn-connection-components to render their connections.
   */
  @Input()
  connectionSvg: TemplateRef<SVGElement>;

  /** Returns a list of all start and end points of dragged connections. */
  get draggedConnections(): { from: Pos, to: Pos }[] {
    const { left: dx, top: dy } = (this.element.nativeElement as HTMLElement).getBoundingClientRect();
    return [
      ...this.draggedConnectionsService.draggedOutputs.map(({ output, cursor }) => ({
        from: this.getCenter(this.portRegistry.getPortRect(output)),
        to: { x: cursor.x - dx, y: cursor.y - dy }
      })),
      ...this.draggedConnectionsService.draggedInputs.map(({ input, cursor }) => ({
        from: { x: cursor.x - dx, y: cursor.y - dy },
        to: this.getCenter(this.portRegistry.getPortRect(input))
      }))
    ];
  }

  constructor(
    private portRegistry: PortRegistryService<PortKey>,
    private draggedConnectionsService: DraggedConnectionsService<PortKey>,
    private element: ElementRef
  ) { }

  ngAfterViewInit(): void {
    if (!this.connectionSvg) {
      /*
       * Wait until the next change detection cycle to update the value to prevent
       * ExpressionChangedAfterItHasBeenCheckedErrors in development mode.
       */
      setTimeout(() => this.connectionSvg = this.defaultConnectionSvg);
    }
  }

  /**
   * Builds a bezier curve with a handle right of the output and one left of the input.
   *
   * Used by the default connection SVG template to render the connection.
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

  /** Calculates the center of the given rectangle. */
  private getCenter(rect: { x: number, y: number, width: number, height: number }): Pos {
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2
    };
  }
}
