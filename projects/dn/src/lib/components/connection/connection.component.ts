import { Component, Input, TemplateRef, AfterViewInit, ElementRef } from '@angular/core';
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
    const output = this.portRegistry.getOutput(this.from);
    const input = this.portRegistry.getInput(this.to);

    if (!output || !input) {
      return { from: { x: 0, y: 0 }, to: { x: 0, y: 0 } };
    }

    return {
      from: { x: output.htmlRect.left + output.htmlRect.width / 2, y: output.htmlRect.top + output.htmlRect.height / 2 },
      to: { x: input.htmlRect.left + input.htmlRect.width / 2, y: input.htmlRect.top + input.htmlRect.height / 2 }
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
