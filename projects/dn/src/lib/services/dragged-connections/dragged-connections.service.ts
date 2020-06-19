import { Injectable } from '@angular/core';

interface Pos {
  x: number;
  y: number;
}

@Injectable({
  providedIn: 'root'
})
export class DraggedConnectionsService<OutputKey, InputKey> {

  public get draggedOutputs(): { output: OutputKey, cursor: Pos }[] {
    return [...this.outputDrags.entries()].map(([ k, v ]) => ({ output: k, cursor: v }));
  }

  public get draggedInputs(): { input: InputKey, cursor: Pos }[] {
    return [...this.inputDrags.entries()].map(([k, v]) => ({ input: k, cursor: v }));
  }

  private outputDrags = new Map<OutputKey, Pos>();
  private inputDrags = new Map<InputKey, Pos>();

  public startOutputDrag(output: OutputKey, cursorPosition: Pos): void {
    this.outputDrags.set(output, cursorPosition);
  }

  public startInputDrag(input: InputKey, cursorPosition: Pos): void {
    this.inputDrags.set(input, cursorPosition);
  }

  public dragOutput(output: OutputKey, cursorPosition: Pos): void {
    if (this.outputDrags.has(output)) {
      this.outputDrags.set(output, cursorPosition);
    }
  }

  public dragInput(input: InputKey, cursorPosition: Pos): void {
    if (this.inputDrags.has(input)) {
      this.inputDrags.set(input, cursorPosition);
    }
  }

  public endOutputDrag(output: OutputKey): void {
    this.outputDrags.delete(output);
  }

  public endInputDrag(input: InputKey): void {
    this.inputDrags.delete(input);
  }
}
