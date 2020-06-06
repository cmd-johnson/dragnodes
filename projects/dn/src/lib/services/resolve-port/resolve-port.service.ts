import { Injectable } from '@angular/core';
import { Port } from '../../data/graph-types';
import { Position } from '../../data/position';
//import { NodePortDirective } from '../../directives/node-port/node-port.directive';

@Injectable({
  providedIn: 'root'
})
export class ResolvePortService {
  //private portMap = new Map<Port, NodePortDirective>();

  constructor() { }

  registerPort(port: Port, element/*: NodePortDirective*/) {
    //this.portMap.set(port, element);
  }

  deregisterPort(port: Port) {
    //this.portMap.delete(port);
  }

  getPosition(port: Port): Position {
    /*const element = this.portMap.get(port);
    if (element) {
      const rect = element.htmlElement.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }*/
    return null;
  }

  getPortDirective(port: Port)/*: NodePortDirective*/ {
    //return this.portMap.get(port);
  }
}
