import { Injectable } from '@angular/core';
import { Port } from '../../data/graph-types';
import { Position } from '../../data/position';

@Injectable({
  providedIn: 'root'
})
export class ResolvePortService {
  private portMap = new Map<Port, HTMLElement>();

  constructor() { }

  registerPort(port: Port, element: HTMLElement) {
    this.portMap.set(port, element);
  }

  deregisterPort(port: Port) {
    this.portMap.delete(port);
  }

  getPosition(port: Port): Position {
    const element = this.portMap.get(port);
    if (element) {
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return null;
  }
}
