import { Component, Input, TemplateRef } from '@angular/core';

import { GraphComponent } from '../graph/graph.component';
import { PortRegistryService } from '../../services/port-registry/port-registry.service';

@Component({
  selector: 'dn-connection',
  templateUrl: './connection.component.html',
  styleUrls: ['./connection.component.scss']
})
export class ConnectionComponent<PortKey> {
  /** The key of the port the connection originates from. */
  @Input()
  from: PortKey;

  /** The key of the port the connection ends at. */
  @Input()
  to: PortKey;

  /**
   * The SVG template to use to render the connection or 'default'.
   *
   * When set to 'default', the connection will use the parent dn-graph's connectionSvg.
   */
  @Input()
  connectionSvg: TemplateRef<SVGElement> | 'default' = 'default';

  /** The context passed to the connectionSvg. */
  get svgContext() {
    const output = this.portRegistry.getPortRect(this.from);
    const input = this.portRegistry.getPortRect(this.to);

    if (!output || !input) {
      return { from: { x: 0, y: 0 }, to: { x: 0, y: 0 } };
    }

    return {
      from: {
        x: output.x + output.width / 2,
        y: output.y + output.height / 2
      },
      to: {
        x: input.x + input.width / 2,
        y: input.y + input.height / 2
      }
    };
  }

  /**
   * The style applied to the info container.
   *
   * Moves the container at the center of the connection.
   */
  get infoContainerStyle() {
    const output = this.portRegistry.getPortRect(this.from);
    const input = this.portRegistry.getPortRect(this.to);
    if (!output || !input) {
      return {};
    }
    const top = Math.round((output.y + output.height / 2 + input.y + input.height / 2) / 2);
    const left = Math.round((output.x + output.width / 2 + input.x + input.width / 2) / 2);
    return {
      top: `${top}px`,
      left: `${left}px`
    };
  }

  /** Used in the connection component template to get the connection's SVG for rendering. */
  get actualConnectionSvg(): TemplateRef<SVGElement> {
    return this.connectionSvg !== 'default' ? this.connectionSvg : this.graph.connectionSvg;
  }

  constructor(
    private graph: GraphComponent<PortKey>,
    private portRegistry: PortRegistryService<PortKey>
  ) { }
}
