import { Injectable } from '@angular/core';
import { NodePortDirective } from '../../directives/node-port/node-port.directive';

@Injectable({
  providedIn: 'root'
})
export class PortRegistryService<OutputKey, InputKey> {

  private outputs = new Map<OutputKey, NodePortDirective<OutputKey, InputKey>>();
  private inputs = new Map<InputKey, NodePortDirective<OutputKey, InputKey>>();

  public getOutput(key: OutputKey): NodePortDirective<OutputKey, InputKey> {
    return this.outputs.get(key);
  }

  public getInput(key: InputKey): NodePortDirective<OutputKey, InputKey> {
    return this.inputs.get(key);
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
