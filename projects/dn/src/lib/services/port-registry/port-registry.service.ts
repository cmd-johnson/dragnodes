import { Injectable } from '@angular/core';

import { Rect } from '../../data/rect';
import { NodePortDirective } from '../../directives/node-port/node-port.directive';

/**
 * Keeps track of all ports currently being displayed in the GraphComponent.
 *
 * Used for fast lookups from port keys to the corresponding NodePortDirective.
 * The service is provided by the GraphComponent and as such is local to a specific graph.
 */
@Injectable({
  providedIn: 'root'
})
export class PortRegistryService<PortKey> {
  private ports = new Map<PortKey, NodePortDirective<PortKey>>();

  public getPort(key: PortKey): NodePortDirective<PortKey> {
    return this.ports.get(key);
  }

  /** Returns the port's rect relative to its containing GraphComponent. */
  public getPortRect(key: PortKey): Rect {
    const output = this.getPort(key);
    if (!output || !output.node || !output.node.nodePos || !output.relativePortRect) { return undefined; }
    return {
      x: output.node.nodePos.x + output.relativePortRect.x,
      y: output.node.nodePos.y + output.relativePortRect.y,
      width: output.relativePortRect.width,
      height: output.relativePortRect.height
    };
  }

  public registerPort(key: PortKey, directive: NodePortDirective<PortKey>) {
    this.ports.set(key, directive);
  }

  public unregisterPort(key: PortKey) {
    this.ports.delete(key);
  }
}
