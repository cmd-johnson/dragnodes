import { Component, Input, TemplateRef, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { PortRegistryService } from '../../services/port-registry/port-registry.service';
import { DraggedConnectionsService } from '../../services/dragged-connections/dragged-connections.service';

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
export class GraphComponent<OutputKey, InputKey> implements AfterViewInit {

  @ViewChild('defaultConnectionSvg')
  private defaultConnectionSvg: TemplateRef<SVGElement>;

  @Input()
  connectionSvg: TemplateRef<SVGElement>;

  @Output()
  connectionAdded = new EventEmitter<{ from: any, to: any }>();

  get draggedConnections(): DraggedConnection[] {
    return [
      ...this.draggedConnectionsService.draggedOutputs.map(({ output, cursor }) => ({
        from: getCenter(this.portRegistry.getOutput(output).htmlRect),
        to: cursor
      })),
      ...this.draggedConnectionsService.draggedInputs.map(({ input, cursor }) => ({
        from: cursor,
        to: getCenter(this.portRegistry.getInput(input).htmlRect)
      }))
    ];
  }

  constructor(
    private portRegistry: PortRegistryService<OutputKey, InputKey>,
    private draggedConnectionsService: DraggedConnectionsService<OutputKey, InputKey>
  ) { }

  ngAfterViewInit(): void {
    if (!this.connectionSvg) {
      this.connectionSvg = this.defaultConnectionSvg;
    }
  }

  defaultConnectionPath({ x: fx, y: fy }: Pos, { x: tx, y: ty }: Pos): string {
    const dx = tx - fx;
    const dy = ty - fy;
    const handleLength = Math.sqrt(dx * dx + dy * dy) / 2;
    return `M${fx},${fy} C${fx + handleLength},${fy} ${tx - handleLength},${ty} ${tx},${ty}`;
  }
}
