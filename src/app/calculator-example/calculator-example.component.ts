import { Component, OnDestroy, OnInit, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';

import { GraphNode, Output, Input, Port, Pos, GraphValueType, GraphNodeType } from './graph-test/graph-node';
import { createNew, deserialize, serialize } from './graph-test/graph-serialization';

@Component({
  selector: 'app-calculator-example',
  templateUrl: './calculator-example.component.html',
  styleUrls: ['./calculator-example.component.scss']
})
export class CalculatorExampleComponent implements OnInit, OnDestroy, AfterViewInit {
  private unsubscribe = new Subject();

  showConnectionContextMenu = false;
  connectionContextMenuPosition: Pos = { x: 0, y: 0 };

  public nodes: GraphNode[] = [];

  private connectionCache: { input: Port<any, any>, output: Port<any, any>, type: GraphValueType }[] = null;
  public get connections(): { input: Port<any, any>, output: Port<any, any>, type: GraphValueType }[] {
    if (this.connectionCache !== null) {
      return this.connectionCache;
    }
    this.connectionCache = this.nodes
      .reduce<Output[]>((outputs: Output[], node: GraphNode) => [
        ...outputs,
        ...[...node.outputs.values()].reduce<Output[]>((a, b) => [...a, ...b], [])
      ], [])
      .filter((o: Output) => o.connectedTo !== null)
      .map(o => ({
        output: o,
        input: o.connectedTo,
        type: o.type
      }));
    return this.connectionCache;
  }

  @ViewChild('graph', { read: ElementRef })
  private graph: ElementRef;
  public graphElement: HTMLElement;

  @ViewChild('connectionContextMenu', { read: ElementRef })
  private connectionContextMenuElement: ElementRef;

  private selectedConnections = new Map<Port<any, any>, Port<any, any>>();

  constructor() { }

  ngOnInit(): void {
    this.deserialize();
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.graphElement = this.graph.nativeElement);
  }

  deserialize() {
    const rawSerialized = window.localStorage.getItem('calculator-graph');
    try {
      const serialized = JSON.parse(rawSerialized);
      const deserialized = deserialize(serialized);
      this.nodes = deserialized;
    } catch (e) {
      console.warn('failed to deserialize calculator graph', e);
    }
  }

  serialize() {
    const serialized = serialize(this.nodes);
    window.localStorage.setItem('calculator-graph', JSON.stringify(serialized));
  }

  private clearConnectionCache() {
    this.connectionCache = null;
  }

  addNode(type: GraphNodeType) {
    this.nodes.push(createNew(type));
    this.serialize();
    this.clearConnectionCache();
  }

  removeNode(node: GraphNode) {
    node.inputs.forEach(is => is.forEach(i => i.disconnectPort()));
    node.outputs.forEach(os => os.forEach(o => o.disconnectPort()));
    this.nodes.splice(this.nodes.findIndex(n => n === node), 1);
    this.serialize();
    this.clearConnectionCache();
  }

  getInputDragOriginPort(): (input: Input) => Input | Output | false {
    return (input: Input) => input.connectedTo !== null ? input.connectedTo : input;
  }

  getDragData(port: Port<any, any>): () => ({ type: GraphValueType }) {
    return () => ({ type: port.type });
  }

  getOutputDragOriginPort(): (output: Output) => Input | Output | false {
    return (output: Output) => output.connectedTo !== null ? output.connectedTo : output;
  }

  canConnect(output: Output, input: Input) {
    return output.canConnectPortTo(input);
  }

  disconnectPort(port: Port<any, any>) {
    port.disconnectPort();
    this.serialize();
    this.clearConnectionCache();
  }

  connect({ input, output }: { input: Input, output: Output }) {
    input.connectPortTo(output);
    this.serialize();
    this.clearConnectionCache();
  }

  portClass(port: Port<any, any>, isDragging: boolean): { [klass: string]: boolean } {
    return {
      [port.type]: true,
      connected: port.isConnected || isDragging
    };
  }

  portTypeClass(type: string): { [klass: string]: true } {
    return { [type]: true };
  }

  connectionPath(output: Pos, input: Pos): string {
    const from = { x: output.x, y: output.y };
    const to = { x: input.x, y: input.y };

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const handleLength = Math.sqrt(dx * dx + dy * dy) / 2;
    return `M${from.x},${from.y} C${from.x + handleLength},${from.y} ${to.x - handleLength},${to.y} ${to.x},${to.y}`;
  }

  connectorPath(center: Pos): string {
    const { x, y } = center;
    return `M${x - 4},${y - 3} L${x - 4},${y + 3} L${x + 0.5},${y + 3} L${x + 3},${y} L${x + 0.5},${y - 3} L${x - 4},${y - 3} Z`;
  }

  connectionSelectionChanged(from: Port<any, any>, to: Port<any, any>, selected: boolean) {
    if (!from || !to) {
      return;
    }
    if (selected) {
      this.selectedConnections.set(from, to);
    } else {
      this.selectedConnections.delete(from);
    }
  }

  onConnectionContextMenu(event: MouseEvent) {
    this.connectionContextMenuPosition = {
      x: event.pageX,
      y: event.pageY
    };
    this.showConnectionContextMenu = true;
  }

  graphKeyDown(event: KeyboardEvent) {
    if (event.key.toLowerCase() !== 'delete' && event.key.toLowerCase() !== 'backspace') { return; }
    if (!event.repeat && this.selectedConnections.size > 0) {
      this.deleteSelectedConnections();
    }
  }

  deleteSelectedConnections() {
    this.selectedConnections.forEach(o => o.disconnectPort());
    this.selectedConnections.clear();
    this.clearConnectionCache();
    this.showConnectionContextMenu = false;
  }

  selectAllConnections() {
    this.selectedConnections.clear();
    this.connections.forEach(c => this.selectedConnections.set(c.output, c.input));
    console.log(this.selectedConnections);
    this.showConnectionContextMenu = false;
  }

  isSelected(from: Port<any, any>, to: Port<any, any>): boolean {
    return this.selectedConnections.get(from) === to;
  }

  @HostListener('document:mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    // Allow ctrl+rightclick to work on firefox without opening the default context menu
    if (event.button === 2 && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Hide the context menu when the user clicked anywhere else but the context menu
    let next = event.target as HTMLElement;
    while (!!next) {
      if (next === this.connectionContextMenuElement.nativeElement) {
        return;
      }
      next = next.parentElement;
    }
    this.showConnectionContextMenu = false;
  }
}
