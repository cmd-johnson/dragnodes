import { Component, OnInit, Input, OnDestroy, ElementRef } from '@angular/core';
import { GraphConnectionsService } from '../../../services/graph-connections/graph-connections.service';
import { Subject } from 'rxjs';
import { takeUntil, map, tap } from 'rxjs/operators';
import { Position } from '../../../data/position';

@Component({
  selector: 'dn-connections',
  templateUrl: './connections.component.html',
  styleUrls: ['./connections.component.scss']
})
export class ConnectionsComponent implements OnInit, OnDestroy {
  /** Emits when all subscriptions should be dropped at the end of the component's lifecycle. */
  private unsubscribe = new Subject();

  connections: { start: Position, end: Position, path: string }[] = [];

  private get ownBounds(): DOMRect {
    return (this.element.nativeElement as HTMLElement).getBoundingClientRect();
  }

  constructor(
    private element: ElementRef,
    private graphConnections: GraphConnectionsService
  ) { }

  ngOnInit(): void {
    this.graphConnections.drawConnections.pipe(
      map((connections: { from: Position, to: Position, direction: 'left' | 'right' }[]) => {
        const bounds = this.ownBounds;
        return connections.map(c => {
          const dx = c.to.x - c.from.x;
          const dy = c.to.y - c.from.y;
          const handleLength = Math.sqrt(dx * dx + dy * dy) / 2 * (c.direction === 'right' ? 1 : -1);
          const start = { x: c.from.x - bounds.left, y: c.from.y - bounds.top };
          const end = { x: c.to.x - bounds.left, y: c.to.y - bounds.top };
          return {
            start,
            end,
            path: `M${start.x},${start.y} C${start.x + handleLength},${start.y} ${end.x - handleLength},${end.y} ${end.x},${end.y}`
          };
        });
      }),
      takeUntil(this.unsubscribe)
    ).subscribe(c => this.connections = c);
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
