import { Component, OnDestroy, ElementRef, Input } from '@angular/core';
import { Subject } from 'rxjs';

import { Position } from '../../../data/position';
import { OutputPort, InputPort, Port } from '../../../data/graph-types';
import { ResolvePortService } from '../../../services/resolve-port/resolve-port.service';

@Component({
  selector: 'dn-connections',
  templateUrl: './connections.component.html',
  styleUrls: ['./connections.component.scss']
})
export class ConnectionsComponent implements OnDestroy {
  /** Emits when all subscriptions should be dropped at the end of the component's lifecycle. */
  private unsubscribe = new Subject();

  get connections(): { start: Position, end: Position, path: string }[] {
    return this.getConnections();
  }

  @Input()
  actualConnections: { from: OutputPort, to: InputPort }[];

  @Input()
  draggedConnections: Map<Port, Position>;

  private get ownBounds(): DOMRect {
    return (this.element.nativeElement as HTMLElement).getBoundingClientRect();
  }

  constructor(
    private element: ElementRef,
    private resolvePortService: ResolvePortService
  ) { }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  // TODO: move this logic into the GraphComponent? (at least the part where the data consists of { from, to, dir })
  private getConnections() {
    const bounds = this.ownBounds;

    const actualConnections = this.actualConnections.map(c => ({
      from: this.resolvePortService.getPosition(c.from),
      to: this.resolvePortService.getPosition(c.to),
      dir: 'right'
    }));
    const draggedConnections = [...this.draggedConnections.entries()].map(([from, to]) => ({
      from: this.resolvePortService.getPosition(from),
      to: { ...to },
      dir: (from instanceof OutputPort) ? 'right' : 'left'
    }));
    const allConnections = actualConnections.concat(draggedConnections);
    const corrected = allConnections.map(({ from, to, dir }) => ({
      from: { x: from.x - bounds.left, y: from.y - bounds.top },
      to: { x: to.x - bounds.left, y: to.y - bounds.top },
      dir
    }));
    const connections = corrected.map(({ from, to, dir }) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const handleLength = Math.sqrt(dx * dx + dy * dy) / 2 * (dir === 'right' ? 1 : -1);
      return {
        start: from,
        end: to,
        path: `M${from.x},${from.y} C${from.x + handleLength},${from.y} ${to.x - handleLength},${to.y} ${to.x},${to.y}`
      };
    });

    return connections;
  }
}
