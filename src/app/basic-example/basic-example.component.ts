import { Component } from '@angular/core';

interface Pos {
  x: number;
  y: number;
}

interface Node {
  position: Pos;
  name: string;
  inputs: string[];
  outputs: string[];
}

interface Connection {
  from: string;
  to: string;
}

@Component({
  selector: 'app-basic-example',
  templateUrl: './basic-example.component.html',
  styleUrls: ['./basic-example.component.scss']
})
export class BasicExampleComponent {
  nodes: Node[] = [
    {
      position: { x: 0, y: 0 },
      name: 'Node A',
      inputs: [ 'Input 1', 'Input 2' ],
      outputs: [ 'Output 1', 'Output 2' ]
    },
    {
      position: { x: 200, y: 0 },
      name: 'Node B',
      inputs: [ 'Input 1', 'Input 2' ],
      outputs: [ 'Output 1', 'Output 2' ]
    },
    {
      position: { x: 400, y: 0 },
      name: 'Node C',
      inputs: [ 'Input 1', 'Input 2' ],
      outputs: [ 'Output 1', 'Output 2' ]
    }
  ];
  connections: Connection[] = [
    {
      from: this.portKey(this.nodes[0], this.nodes[0].outputs[0]),
      to: this.portKey(this.nodes[1], this.nodes[0].inputs[0])
    },
    {
      from: this.portKey(this.nodes[0], this.nodes[0].outputs[1]),
      to: this.portKey(this.nodes[1], this.nodes[0].inputs[1])
    },
    {
      from: this.portKey(this.nodes[1], this.nodes[0].outputs[0]),
      to: this.portKey(this.nodes[2], this.nodes[0].inputs[1])
    },
    {
      from: this.portKey(this.nodes[1], this.nodes[0].outputs[1]),
      to: this.portKey(this.nodes[2], this.nodes[0].inputs[0])
    }
  ];

  /** Used by *ngFor to track nodes for more efficient change detection. */
  trackNode(_, node: Node) {
    return node.name;
  }

  /** The key by which the given port is tracked inside dragnodes. */
  portKey(node: Node, port: string) {
    return `${node.name}_${port}`;
  }

  /**
   * Callback passed to dragnodes that determines if a connection between the ports can be established.
   *
   * Since established connections are not tracked by dragnodes, it does not
   * know if a port is already taken or not. Here, we simply check if there is
   * already an existing connection from one of the potential connection's
   * ports and if not, allow the connection to happen.
   *
   * This callback determines if dragnodes triggers the (connect) event on the
   * ng-port directive the connection was dropped on or not.
   *
   * Note: regardless of what you return here, dn-inputs cannot be connected to
   * other dn-inputs. The same goes for dn-outputs connecting to dn-outputs.
   *
   * Note: this callback is declared as an arrow function to make sure 'this'
   * still references this component when passing the function to the port
   * directive.
   */
  canConnect = (output: string, input: string) => {
    return !this.connections.some(c => c.from === output || c.to === input);
  }

  /**
   * Callback passed to dragnodes that determines the port a connection drag should start at.
   *
   * Usually, when dragging a port, you'd want the dragged connection to
   * originate from that same port. But, if the port is already connected, the
   * connection should probably start at the port the dragged port is connected to.
   *
   * The (dragStarted) event will trigger on the port with the port key you
   * return here, and therefore not necessarily on the port the use dragged
   * from.
   *
   * If the port is already connected to a different port, the (dragStarted)
   * event of the port is the right place to clear the existing connection.
   *
   * Note: as with canConnect, this callback is declared as an arrow function
   * to make sure 'this' still references this component when passing the
   * function to the port directive.
   *
   * Note: you can also return false to prevent dragnodes from starting a
   * dragged connection.
   */
  getDragOriginPort = (port: string): string => {
    const existingConnection = this.connections.find(c => c.from === port || c.to === port);
    if (existingConnection) {
      const { from, to } = existingConnection;
      return from === port ? to : from;
    }
    return port;
  }

  /**
   * Removes an existing connection from/to the given port.
   *
   * In this example, this method is called when starting dragging a connection
   * from an input or output.
   */
  disconnectPort(port: string) {
    const index = this.connections.findIndex(c => c.from === port || c.to === port);
    if (index >= 0) {
      this.connections.splice(index, 1);
    }
  }

  /**
   * Handles the (connect) event emitted by an input or output by adding a connection.
   *
   * The event is triggered when a dragged connection is dropped on a valid
   * target port (i.e. the start and target port are not both dn-inputs or both
   * dn-outputs and the canConnect callback returned true).
   */
  connect({ output, input }: { output: string, input: string }) {
    this.connections.push({ from: output, to: input });
  }
}
