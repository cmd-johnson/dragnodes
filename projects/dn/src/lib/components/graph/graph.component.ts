import { Component, ViewChildren, QueryList, AfterViewInit, ElementRef } from '@angular/core';
import { GraphNode, Connection, InputPort, OutputPort } from '../../data/graph-types';
import { Position } from '../../data/position';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { NodeDirective } from '../../directives/node/node.directive';
import interact from 'interactjs';
import { NodePortDirective } from '../../directives/node-port/node-port.directive';
import { GraphConnectionsService } from '../../services/graph-connections/graph-connections.service';
import { GraphService } from '../../services/graph/graph.service';

const activeConnectionDrags = Symbol('activeConnectionDrags');
const connections = Symbol('connections');

@Component({
  selector: 'dn-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss'],
  providers: [ GraphConnectionsService, GraphService ]
})
export class GraphComponent implements AfterViewInit {

  nodes: GraphNode[] = [];

  private nodeCounter = 0;

  @ViewChildren(NodeDirective)
  private childNodes: QueryList<NodeDirective>;
  private knownNodes = new Set<NodeDirective>();

  @ViewChildren(NodePortDirective)
  private childNodePorts: QueryList<NodePortDirective>;
  private knownNodePorts = new Set<NodePortDirective>();

  [activeConnectionDrags] = new Map<NodePortDirective, { from: Position, to: Position, path: string }>();
  [connections] = new Map<NodePortDirective, { to: NodePortDirective, connection: Connection }>();

  get activeConnectionDrags(): { from: Position, to: Position, path: string }[] {
    return [...this[activeConnectionDrags].values()];
  }

  constructor(
    private element: ElementRef
  ) { }

  ngAfterViewInit(): void {
    this.childNodes.changes.subscribe(() => {
      const newNodes = this.childNodes.filter(n => !this.knownNodes.has(n));
      const currentChilds = new Set(this.childNodes);
      const deletedNodes = [...this.knownNodes].filter(n => !currentChilds.has(n));

      deletedNodes.forEach(n => {
        this.knownNodes.delete(n);
        console.log(`deleted node ${n.node.name}`);
      });
      newNodes.forEach(n => {
        this.knownNodes.add(n);
        this.registerNode(n);
      });
    });

    this.childNodePorts.changes.subscribe(() => {
      const newPorts = this.childNodePorts.filter(p => !this.knownNodePorts.has(p));
      const currentPorts = new Set(this.childNodePorts);
      const deletedPorts = [...this.knownNodePorts].filter(p => !currentPorts.has(p));
      console.log(newPorts, deletedPorts);

      deletedPorts.forEach(p => {
        this.knownNodePorts.delete(p);
        console.log(`deleted port ${p.port.name}`);
      });
      newPorts.forEach(p => {
        this.knownNodePorts.add(p);
        this.registerPort(p);
      });
    });
  }

  addNode() {
    let node: GraphNode;
    switch (this.nodeCounter % 5) {
      case 0:
        node = new GraphNode(`Node #${this.nodeCounter} (source)`);
        node.addOutputs(new OutputPort('source', new BehaviorSubject(`hello from ${node.name}`)));
        break;
      case 1:
      case 2:
      case 3: {
        node = new GraphNode(`Node #${this.nodeCounter} (transformer)`);
        const input = new InputPort('sink');
        const outputObservable = input.subject.pipe(map(v => `${v} → ${this.nodeCounter}`));
        const output = new OutputPort('source', outputObservable);

        node.addOutputs(output);
        node.addInputs(new InputPort('sink'));

        break;
      }
      default: {
        node = new GraphNode(`Node #${this.nodeCounter} (sink)`);
        const input = new InputPort('sink');
        input.subject.subscribe(v => console.log(`Node #${this.nodeCounter}: ${v}`));
        node.addInputs(input);
      }
    }
    this.nodeCounter++;

    this.nodes.push(node);
  }

  private registerNode(node: NodeDirective) {
    console.log(`registering node ${node.node.name}`);

    const interaction = interact(node.nativeElement);

    interaction.draggable({
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: 'parent',
          endOnly: false
        })
      ],
      autoScroll: true,
      onmove: e => {
        this.onDragNode(node, e);
      }
    });
    interaction.on('doubletap', () => { this.deleteNode(node.node); })
  }

  private onDragNode(node: NodeDirective, event: any) {
    const { x, y } = node.position;
    node.position = {
      x: x + event.delta.x,
      y: y + event.delta.y
    };
  }

  private registerPort(port: NodePortDirective) {
    console.log(`registering node port ${port.port.name}`);

    const interaction = interact(port.nativeElement);

    interaction.draggable({
      autoScroll: true,
      onmove: e => {
        this.onDragPort(port, e);
      },
      onend: e => {
        this.onDropPort(port);
        e.originPort = port;
      }
    });

    interaction.dropzone({
      ondrop: e => {
        const from = e.dragEvent.originPort as NodePortDirective;
        const to = port;

        const hasOutput = (from.port instanceof OutputPort) || (to.port instanceof OutputPort);
        const hasInput = (from.port instanceof InputPort) || (to.port instanceof InputPort);

        if (!hasOutput || !hasInput) {
          console.warn(`Cannot connect an input to input or output to output`);
          return;
        }

        const output = (from.port instanceof OutputPort) ? from.port as OutputPort : to.port as OutputPort;
        const input = (to.port instanceof InputPort) ? to.port as InputPort : from.port as InputPort;

        console.log(`dragged connection from ${from.port.parent.name} - ${from.port.name} to ${to.port.parent.name} - ${to.port.name}`);
        console.log(`adding connection ${output.parent.name}-${output.name} → ${input.parent.name}-${input.name}`);

        this[connections].set(e.dragEvent.originPort, {
          to: port,
          connection: Connection.connect(output, input)
        });
      }
    });
  }

  private onDragPort(port: NodePortDirective, event: any) {
    const parentRect = (this.element.nativeElement as HTMLElement).querySelector('#node-container').getBoundingClientRect();
    const portRect = port.nativeElement.getBoundingClientRect();

    const from = {
      x: portRect.left + portRect.width / 2 - parentRect.left,
      y: portRect.top + portRect.height / 2 - parentRect.top
    };
    const to = {
      x: event.client.x - parentRect.left,
      y: event.client.y - parentRect.top
    };

    const dx = to.x - from.x;
    const dy = to.y - from.y;

    const isOutput = port.port instanceof OutputPort;
    const handleLength = Math.sqrt(dx * dx + dy * dy) / 2 * (isOutput ? 1 : -1);

    this[activeConnectionDrags].set(port, {
      from, to, path: `M${from.x},${from.y} C${from.x + handleLength},${from.y} ${to.x - handleLength},${to.y}, ${to.x},${to.y}`
    });
  }

  private onDropPort(port: NodePortDirective) {
    this[activeConnectionDrags].delete(port);
  }

  deleteNode(node: GraphNode) {
    const nodeIndex = this.nodes.findIndex(n => n === node);
    if (nodeIndex >= 0) {
      this.nodes.splice(nodeIndex, 1);
    }
  }

}
