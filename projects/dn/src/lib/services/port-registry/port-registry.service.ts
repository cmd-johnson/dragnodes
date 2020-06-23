import { Injectable } from '@angular/core';
import { NodePortDirective } from '../../directives/node-port/node-port.directive';

@Injectable({
  providedIn: 'root'
})
export class PortRegistryService<OutputKey, InputKey> {

  private outputs = new Map<OutputKey, NodePortDirective<OutputKey, InputKey>>();
  private inputs = new Map<InputKey, NodePortDirective<OutputKey, InputKey>>();
  public graphOffset = { dx: 0, dy: 0 };

  public getOutput(key: OutputKey): NodePortDirective<OutputKey, InputKey> {
    return this.outputs.get(key);
  }

  public getInput(key: InputKey): NodePortDirective<OutputKey, InputKey> {
    return this.inputs.get(key);
  }

  public getOutputRect(key: OutputKey) {
    const output = this.getOutput(key);
    if (!output) { return undefined; }
    return moveRect(output.htmlRect, this.graphOffset.dx, this.graphOffset.dy);
  }

  public getInputRect(key: InputKey) {
    const input = this.getInput(key);
    if (!input) { return undefined; }
    return moveRect(input.htmlRect, this.graphOffset.dx, this.graphOffset.dy);
  }

  public registerOutput(key: OutputKey, directive: NodePortDirective<OutputKey, InputKey>) {
    this.outputs.set(key, directive);
  }

  public registerInput(key: InputKey, directive: NodePortDirective<OutputKey, InputKey>) {
    this.inputs.set(key, directive);
  }

  public unregisterOutput(key: OutputKey) {
    this.outputs.delete(key);
  }

  public unregisterInput(key: InputKey) {
    this.inputs.delete(key);
  }
}

function moveRect(rect: ClientRect, dx: number, dy: number) {
  const { top, bottom, left, right, width, height } = rect;
  return {
    top: top + dy, bottom: bottom + dy,
    left: left + dx, right: right + dx,
    width, height
  };
}
