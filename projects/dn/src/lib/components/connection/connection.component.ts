import { Component, Input, TemplateRef, ElementRef } from '@angular/core';
import { PortRegistryService } from '../../services/port-registry/port-registry.service';
import { GraphComponent } from '../graph/graph.component';

@Component({
  selector: 'dn-connection',
  templateUrl: './connection.component.html',
  styleUrls: ['./connection.component.scss']
})
export class ConnectionComponent<OutputKey, InputKey> {
  @Input()
  from: OutputKey;

  @Input()
  to: InputKey;

  @Input()
  connectionSvg: TemplateRef<SVGElement> | 'default' = 'default';

  get svgContext() {
    const { dx, dy } = this.graph.graphOffset;

    const output = this.portRegistry.getOutputRect(this.from);
    const input = this.portRegistry.getInputRect(this.to);

    if (!output || !input) {
      return { from: { x: 0, y: 0 }, to: { x: 0, y: 0 } };
    }

    return {
      from: {
        x: output.left + output.width / 2 + dx,
        y: output.top + output.height / 2 + dy
      },
      to: {
        x: input.left + input.width / 2 + dx,
        y: input.top + input.height / 2 + dy
      }
    };
  }

  get actualConnectionSvg(): TemplateRef<SVGElement> {
    return this.connectionSvg !== 'default' ? this.connectionSvg : this.graph.connectionSvg;
  }

  constructor(
    private graph: GraphComponent<OutputKey, InputKey>,
    private portRegistry: PortRegistryService<OutputKey, InputKey>
  ) { }
}
