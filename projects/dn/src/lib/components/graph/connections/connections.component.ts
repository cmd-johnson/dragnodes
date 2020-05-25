import { Component, OnDestroy, ElementRef, Input } from '@angular/core';
import { Subject } from 'rxjs';

import { Position } from '../../../data/position';
import { OutputPort, InputPort } from '../../../data/graph-types';
import { ResolvePortService } from '../../../services/resolve-port/resolve-port.service';

@Component({
  selector: 'dn-connections',
  templateUrl: './connections.component.html',
  styleUrls: ['./connections.component.scss']
})
export class ConnectionsComponent implements OnDestroy {
  /** Emits when all subscriptions should be dropped at the end of the component's lifecycle. */
  private unsubscribe = new Subject();

  get connections(): { from: Position, to: Position, path: string }[] {
    return this.getConnections();
  }

  @Input()
  visibleConnections: { from: Position | OutputPort, to: Position | InputPort }[];

  private get ownBounds(): { top: number, left: number } {
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

  private getConnections(): { from: Position, to: Position, path: string }[] {
    const bounds = this.ownBounds;

    return (this.visibleConnections || [])
      .map(({ from, to }) => ({
        from: (from instanceof OutputPort) ? this.resolvePortService.getPosition(from) : from,
        to: (to instanceof InputPort) ? this.resolvePortService.getPosition(to) : to
      }))
      .map(({ from, to }) => ({
        from: { x: from.x - bounds.left, y: from.y - bounds.top },
        to: { x: to.x - bounds.left, y: to.y - bounds.top }
      }))
      .map(({ from, to }) => {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const handleLength = Math.sqrt(dx * dx + dy * dy) / 2;
        return {
          from,
          to,
          path: `M${from.x},${from.y} C${from.x + handleLength},${from.y} ${to.x - handleLength},${to.y} ${to.x},${to.y}`
        };
      });
  }
}
