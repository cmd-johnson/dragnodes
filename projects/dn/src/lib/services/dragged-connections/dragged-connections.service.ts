import { Injectable } from '@angular/core';

import { Pos } from '../../data/pos';

/**
 * Keeps track of all connections that are currently being dragged.
 *
 * The service is provided by the GraphComponent and as such is local to a specific graph.
 */
@Injectable({
  providedIn: 'root'
})
export class DraggedConnectionsService<PortKey> {
  /** Returns all dragged connections originating from an output port. */
  public get draggedOutputs(): { output: PortKey, cursor: Pos }[] {
    return [...this.outputDrags.entries()].map(([ k, v ]) => ({ output: k, cursor: v }));
  }

  /** Returns all dragged connections originating from an input port. */
  public get draggedInputs(): { input: PortKey, cursor: Pos }[] {
    return [...this.inputDrags.entries()].map(([k, v]) => ({ input: k, cursor: v }));
  }

  /** Keeps track of all dragged connections originating from output ports and their target cursor position. */
  private outputDrags = new Map<PortKey, Pos>();

  /** Keeps track of all dragged connections originating from input ports and their target cursor position. */
  private inputDrags = new Map<PortKey, Pos>();

  /** Starts dragging a connection from an output port to the cursorPosition. */
  public startOutputDrag(output: PortKey, cursorPosition: Pos): void {
    this.outputDrags.set(output, cursorPosition);
  }

  /** Starts dragging a connection from an input port to the cursorPosition. */
  public startInputDrag(input: PortKey, cursorPosition: Pos): void {
    this.inputDrags.set(input, cursorPosition);
  }

  /** Continues dragging a connection from an output port to the cursorPosition. */
  public dragOutput(output: PortKey, cursorPosition: Pos): void {
    if (this.outputDrags.has(output)) {
      this.outputDrags.set(output, cursorPosition);
    }
  }

  /** Continues dragging a connection from an input port to the cursorPosition. */
  public dragInput(input: PortKey, cursorPosition: Pos): void {
    if (this.inputDrags.has(input)) {
      this.inputDrags.set(input, cursorPosition);
    }
  }

  /** Removes the dragged connection originating from an output port. */
  public endOutputDrag(output: PortKey): void {
    this.outputDrags.delete(output);
  }

  /** Removes the dragged connection originating from an input port. */
  public endInputDrag(input: PortKey): void {
    this.inputDrags.delete(input);
  }
}
