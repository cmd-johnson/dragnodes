import { Injectable } from '@angular/core';
import { Port, OutputPort, GraphNode, InputPort } from '../../data/graph-types';
import { Position } from '../../data/position';
import { ReplaySubject } from 'rxjs';
import { distinctUntilChanged, publish, refCount } from 'rxjs/operators';

const drawConnections = Symbol('drawConnections');

@Injectable({
  providedIn: 'root'
})
export class GraphConnectionsService {

  private portMap = new Map<Port, HTMLElement>();

  private activeDraggedConnections = new Map<Port, Position>();
  private activeConnections = new Map<OutputPort, InputPort>();

  [drawConnections] = new ReplaySubject<{ from: Position, to: Position, direction: 'left' | 'right' }[]>(1);
  drawConnections = this[drawConnections].pipe(
    distinctUntilChanged((a, b) => {
      if (a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (a[i].direction !== b[i].direction ||
          a[i].from.x !== b[i].from.x ||
          a[i].from.y !== b[i].from.y ||
          a[i].to.x !== b[i].to.x ||
          a[i].to.y !== b[i].to.y
        ) {
          return false;
        }
      }
      return true;
    }),
    publish(),
    refCount()
  );

  constructor() { }

  registerPort(port: Port, element: HTMLElement) {
    this.portMap.set(port, element);
    console.log(this.portMap);
  }

  deregisterPort(port: Port) {
    this.portMap.delete(port);
    console.log(this.portMap);
  }

  dragConnection(startedAt: Port, cursorPos: Position) {
    this.activeDraggedConnections.set(startedAt, cursorPos);
    this.updateConnections();
  }

  releaseConnection(startedAt: Port) {
    this.activeDraggedConnections.delete(startedAt);
    this.updateConnections();
  }

  connect(a: Port, b: Port) {
    let input: InputPort;
    let output: OutputPort;
    if (a instanceof InputPort && b instanceof OutputPort) {
      input = a as InputPort;
      output = b as OutputPort;
    } else if (a instanceof OutputPort && b instanceof InputPort) {
      output = a as OutputPort;
      input = b as InputPort;
    } else {
      return; // Cannot connect an input to another input or an output to another output.
    }

    this.activeConnections.set(output, input);
    this.updateConnections();
  }

  nodeMoved() {
    this.updateConnections();
  }

  private getPortClientPosition(port: Port): Position | null {
    const element = this.portMap.get(port);
    if (element !== undefined) {
      const rect = element.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }
    return null;
  }

  private updateConnections() {
    const draggedConnections = [...this.activeDraggedConnections.entries()].reduce((connections, [port, cursorPos]) => {
      const portLocation = this.getPortClientPosition(port);
      if (portLocation) {
        connections.push({
          from: portLocation, to: cursorPos, direction: (port instanceof OutputPort) ? 'right' : 'left'
        });
      }
      return connections;
    }, []);
    const activeConnections = [...this.activeConnections.entries()].reduce((connections, [from, to]) => {
      const fromPos = this.getPortClientPosition(from);
      const toPos = this.getPortClientPosition(to);
      if (fromPos && toPos) {
        connections.push({ from: fromPos, to: toPos, direction: 'right' });
      }
      return connections;
    }, []);

    this[drawConnections].next(activeConnections.concat(draggedConnections));
  }
}
